import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MicrophoneState, VoiceChatService } from '@app/services/voice-chat/voice-chat.service';

@Component({
    selector: 'app-voice-chat',
    templateUrl: './voice-chat.component.html',
    styleUrls: ['./voice-chat.component.scss'],
})
export class VoiceChatComponent implements OnInit, OnDestroy {
    @Input() roomId!: string;

    microphoneState = MicrophoneState.Disabled;
    microphoneStateEnum = MicrophoneState;

    constructor(readonly voiceChatService: VoiceChatService, private readonly changeDetectorRef: ChangeDetectorRef) {}

    async ngOnInit() {
        if (!this.roomId) throw new Error('No room id for voice chat');
        this.subscribeToMicrophoneStateChanges();
        await this.voiceChatService.initialize();
        this.voiceChatService.joinRoom(this.roomId);
    }

    ngOnDestroy() {
        this.quitVoiceChat();
    }

    getMicrophoneIcon(): string {
        switch (this.voiceChatService.microphoneState) {
            case MicrophoneState.On:
                return 'mic';
            case MicrophoneState.Off:
                return 'mic_off';
            case MicrophoneState.Disabled:
            default:
                return 'mic_none';
        }
    }

    getMicrophoneClass(): string {
        switch (this.voiceChatService.microphoneState) {
            case MicrophoneState.On:
                return 'mic-on';
            case MicrophoneState.Off:
                return 'mic-off';
            case MicrophoneState.Disabled:
            default:
                return 'mic-disabled';
        }
    }

    quitVoiceChat() {
        this.voiceChatService.leaveRoom();
    }

    private subscribeToMicrophoneStateChanges() {
        this.voiceChatService.microphoneState$.subscribe((microPhoneState) => {
            this.microphoneState = microPhoneState as MicrophoneState;
            this.changeDetectorRef.detectChanges();
        });
    }
}
