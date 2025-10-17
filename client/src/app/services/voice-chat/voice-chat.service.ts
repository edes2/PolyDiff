import { Injectable } from '@angular/core';
import { ChatService } from '@app/services/communication/chat.service';
import { DataConnection, MediaConnection, Peer } from 'peerjs';
import { BehaviorSubject, Observable } from 'rxjs';

export enum MicrophoneState {
    Disabled,
    On,
    Off,
}

const MICROPHONE_DEFAULT_STATE: MicrophoneState = MicrophoneState.Off;

@Injectable({
    providedIn: 'root',
})
export class VoiceChatService {
    microphoneState$: Observable<MicrophoneState>;

    private microphoneStateSubject: BehaviorSubject<MicrophoneState>;
    private outputMediaStream: MediaStream | null = null;
    private peer: Peer | null = null;
    private peers: { [id: string]: DataConnection } = {};
    private peersAudio: { [id: string]: HTMLAudioElement } = {};
    private room: string;

    constructor(private readonly chatService: ChatService) {
        this.microphoneStateSubject = new BehaviorSubject<MicrophoneState>(MicrophoneState.Disabled);
        this.microphoneState$ = this.microphoneStateSubject.asObservable();
        this.initializeSockets();
    }

    get microphoneState(): MicrophoneState {
        return this.microphoneStateSubject.value;
    }

    private get socket() {
        return this.chatService.socket;
    }

    async initialize() {
        await this.initialMicrophoneAccessRequest();
        await this.subscribeToPermissionChanges();
    }

    joinRoom(roomId: string) {
        this.room = roomId;
        console.log('Joining room', this.room);
        this.peer = new Peer();
        this.peer.on('open', (id) => this.socket.emit('joinVoiceChat', { roomId, peerId: id }));
        this.peer.on('connection', (conn) => this.setupPeerConnection(conn));
        this.peer.on('error', (error) => console.error('Peer error', error, error.type));
        this.peer.on('call', async (call) => this.answerCall(call));
    }

    leaveRoom() {
        Object.values(this.peersAudio).forEach((audio) => audio.pause()); // Stop peers audio
        Object.values(this.peers).forEach((conn) => conn.close()); // Close peer connections
        this.peers = {};
        this.peersAudio = {};
        this.setMicrophoneState(MicrophoneState.Off);
        this.destroyAudioTrack();
        this.outputMediaStream = null;
        if (!this.peer) return;
        this.socket.emit('leaveVoiceChat', { roomId: this.room, peerId: this.peer.id });
        this.peer.destroy();
    }

    async toggleMicrophone(): Promise<void> {
        switch (this.microphoneState) {
            case MicrophoneState.On:
                this.turnMicrophoneOff();
                break;
            case MicrophoneState.Off:
                this.turnMicrophoneOn();
                break;
        }
    }

    async turnMicrophoneOn() {
        console.log('Turning microphone on...');
        await this.ensureMicrophoneAccess();
        this.attachMediaStream();

        if (this.outputMediaStream) {
            this.enableAudioTrack();
            this.microphoneStateSubject.next(MicrophoneState.On);
            console.log('Turning microphone on: success');
        } else {
            console.log('Turning microphone on: failed');
            this.disableMicrophone();
        }
    }

    async turnMicrophoneOff() {
        console.log('Turning microphone off...');
        await this.ensureMicrophoneAccess();
        if (!this.outputMediaStream) {
            console.log('Cannot turn microphone off: no access');
            this.disableMicrophone();
            return;
        }
        this.disableAudioTrack();
        this.microphoneStateSubject.next(MicrophoneState.Off);
        console.log('Turning microphone off: success');
    }

    disableMicrophone() {
        this.microphoneStateSubject.next(MicrophoneState.Disabled);
        this.disableAudioTrack();
    }

    async ensureMicrophoneAccess() {
        if (this.outputMediaStream) return;
        console.log('ensureMicrophoneAccess');
        return this.requestMicrophoneAccess();
    }

    private async requestMicrophoneAccess(): Promise<MediaStream | null> {
        try {
            this.outputMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.disableAudioTrack(); // Mute users by default
            return this.outputMediaStream;
        } catch (error) {
            return null;
        }
    }

    private async answerCall(call: MediaConnection) {
        await this.ensureMicrophoneAccess();
        if (!this.outputMediaStream) {
            console.error('No output media stream to answer call');
        }
        call.answer(this.outputMediaStream ? this.outputMediaStream : undefined);
        call.on('stream', (stream) => this.handleIncomingStream(stream));
    }

    private async subscribeToPermissionChanges() {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        permissionStatus.onchange = async () => this.handleMicrophonePermissionChange(permissionStatus.state);
    }

    private async handleMicrophonePermissionChange(state: PermissionState) {
        const isGranted = state === 'granted';
        const newState = isGranted ? MICROPHONE_DEFAULT_STATE : MicrophoneState.Disabled;
        await this.setMicrophoneState(newState);
        // In case we didn't previously attach the media stream to the peer connections
        // (because we didn't have access). We do it now that we have access.
        const wasPreviouslyDisabled = isGranted;
        if (wasPreviouslyDisabled) this.attachMediaStream();
    }

    private async initialMicrophoneAccessRequest(): Promise<void> {
        return this.setMicrophoneState(MICROPHONE_DEFAULT_STATE);
    }

    private async setMicrophoneState(state: MicrophoneState) {
        switch (state) {
            case MicrophoneState.On:
                this.turnMicrophoneOn();
                break;
            case MicrophoneState.Off:
                this.turnMicrophoneOff();
                break;
            case MicrophoneState.Disabled:
            default:
                this.disableMicrophone();
                break;
        }
    }

    private initializeSockets() {
        this.socket.on('newVoicePeer', async (peerId: string) => this.connectToPeer(peerId));
        this.socket.on('voicePeerLeft', (peerId: string) => this.disconnectPeer(peerId));
    }

    private async connectToPeer(...peerIds: string[]) {
        if (!this.peer) throw new Error('Peer is not initialized');
        console.log('Connecting to peers', peerIds);
        peerIds.forEach(async (peerId) => {
            if (!this.peer) return;
            console.log('Calling peer', peerId);
            await this.ensureMicrophoneAccess();
            if (!this.outputMediaStream) throw new Error('No output media stream to call peer');
            const call = this.peer.call(peerId, this.outputMediaStream);
            call.on('stream', (stream) => this.handleIncomingStream(stream));
        });
    }

    private setupPeerConnection(conn: DataConnection) {
        console.log('New peer connection', conn);
        this.peers[conn.peer] = conn;

        conn.on('close', () => this.disconnectPeer(conn.peer));
        conn.on('data', (data: any) => {
            if (data.type === 'stream') this.handleIncomingStream(data.stream);
        });

        this.attachMediaStreamToPeerConnection(conn);
    }

    private handleIncomingStream(stream: MediaStream) {
        console.log('Incoming stream', stream);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();
        this.peersAudio[stream.id] = audio;
    }

    private disconnectPeer(peerId: string) {
        if (!this.peers[peerId]) return;
        this.peers[peerId].close();
        delete this.peers[peerId];
        delete this.peersAudio[peerId];
    }

    private enableAudioTrack() {
        console.log('Unmute voice track..');
        const audioTrack = this.outputMediaStream?.getAudioTracks()[0];
        if (!audioTrack) return;
        audioTrack.enabled = true;
        console.log('Voice track unmuted');
    }

    private disableAudioTrack() {
        console.log('Mute voice track..');
        const audioTrack = this.outputMediaStream?.getAudioTracks()[0];
        if (!audioTrack) return;
        audioTrack.enabled = false;
        console.log('Voice track muted');
    }

    private destroyAudioTrack() {
        console.log('Destroying voice track..');
        const audioTrack = this.outputMediaStream?.getAudioTracks()[0];
        if (!audioTrack) return;
        audioTrack.stop();
        console.log('Voice track destroyed');
    }

    private attachMediaStreamToPeerConnection(conn: DataConnection) {
        console.log('Attaching media stream to peer connection', conn, '...');
        this.outputMediaStream?.getTracks().forEach((track) => {
            console.log(`Adding track to ${conn.peer}`, track);
            conn.peerConnection?.addTrack(track, this.outputMediaStream as MediaStream);
        });
    }

    private attachMediaStream() {
        // this.detachMediaStream(); // Detach previous media stream (if any)
        Object.values(this.peers).forEach((conn) => this.attachMediaStreamToPeerConnection(conn));
    }

    // // Detach the media stream from all existing peer connections
    // private detachMediaStream() {
    //     Object.values(this.peers).forEach((conn) =>
    //         conn.peerConnection?.getSenders().forEach((sender) => {
    //             conn.peerConnection?.removeTrack(sender);
    //         }),
    //     );
    // }
}
