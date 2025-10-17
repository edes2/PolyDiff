import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChatService } from '@app/services/communication/chat.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { GameMode } from '@common/enums/mode';
import { ClientEvent, ServerEvent } from '@common/enums/socket-events';
import { GameConfig } from '@common/interfaces/game-config';
import { PublicUserAccount, UserAccount } from '@common/interfaces/user';
import { WaitingRoomDTO } from '@common/interfaces/waiting-room';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class RoomsService {
    classicWaitingGames$: Observable<WaitingRoomDTO[]>;
    limitedWaitingGames$: Observable<WaitingRoomDTO[]>;

    private classicWaitingGameSubject = new BehaviorSubject<WaitingRoomDTO[]>([]);
    private limitedWaitingGameSubject = new BehaviorSubject<WaitingRoomDTO[]>([]);

    private currentRoom: WaitingRoomDTO | null = null;
    private user: UserAccount | null = null;

    // eslint-disable-next-line max-params
    constructor(
        private communicationService: CommunicationService,
        private socketService: SocketClientService,
        private chatService: ChatService,
        private authService: AuthService,
        private router: Router,
    ) {
        this.user = this.authService.getUserInfo();
        if (!this.user) throw new Error('User not connected');

        this.classicWaitingGames$ = this.classicWaitingGameSubject.asObservable();
        this.limitedWaitingGames$ = this.limitedWaitingGameSubject.asObservable();

        this.socketService.onEvent(ClientEvent.UpdateWaitingRooms, (gameRooms: WaitingRoomDTO[]) => {
            this.updateRooms(gameRooms);
        });
    }

    get currentRoomInfo(): WaitingRoomDTO | null {
        if (!this.currentRoom) return null;

        // Make sure the current room is still valid
        if (!this.allRoomsInfo.some((room) => room.roomId === this.currentRoom?.roomId)) {
            this.resetWaitingRoom();
            return null;
        }

        return this.currentRoom;
    }

    private get allRoomsInfo(): WaitingRoomDTO[] {
        return this.classicWaitingGameSubject.value.concat(this.limitedWaitingGameSubject.value);
    }

    async fetchWaitingRooms(): Promise<void> {
        this.communicationService.allGameroomsGet().subscribe((rooms: WaitingRoomDTO[]) => {
            this.updateRooms(rooms);
        });
    }

    updateRooms(rooms: WaitingRoomDTO[]): void {
        const classicRooms = rooms.filter((room) => this.isClassicMode(room));
        const limitedRooms = rooms.filter((room) => !this.isClassicMode(room));
        this.classicWaitingGameSubject.next(classicRooms);
        this.limitedWaitingGameSubject.next(limitedRooms);
    }

    createRoom(config: GameConfig): void {
        this.socketService.emitEvent(ServerEvent.StartGameCreation, config, (data: any) => {
            const userId = this.authService.getUserInfo()?.uid;
            if (!userId) return;
            const roomId = data.roomId;
            this.chatService.socket.emit('newChat', 'PrivateChat: ' + roomId);
            this.chatService.addPrivateChannel(roomId);
            this.chatService.joinPrivateChannel(userId, roomId);
            this.currentRoom = {
                cardId: config.cardId,
                roomId,
                players: data.players,
                ownerId: userId,
                mode: config.mode,
            };
            this.redirectToWaitingRoom();
        });
    }

    redirectToWaitingRoom(): void {
        this.router.navigate(['waiting-room']);
    }

    joinRoom(roomInfo: WaitingRoomDTO) {
        this.socketService.emitEvent(ServerEvent.JoinMultiGame, roomInfo.ownerId, (success: boolean) => {
            if (success) {
                const uid = this.authService.getUserInfo()?.uid;
                if (!uid) throw new Error('No user id');
                this.chatService.addPrivateChannel(roomInfo.roomId);
                this.chatService.joinPrivateChannel(uid, roomInfo.roomId);
                this.currentRoom = roomInfo;
                this.redirectToWaitingRoom();
            } else {
                throw new Error('Failed to join room');
            }
        });
    }

    joinRandomRoom(mode: GameMode) {
        const rooms = mode === GameMode.Classic ? this.classicWaitingGameSubject.value : this.limitedWaitingGameSubject.value;
        if (!rooms.length) return;
        const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
        this.joinRoom(randomRoom);
    }

    quitRoom(): void {
        try {
            if (!this.currentRoom) throw new Error('No room to quit');
            if (!this.user) throw new Error('No user to quit room');
            const isOwer = this.user?.uid === this.currentRoom.ownerId;
            if (isOwer) {
                this.deleteWaitingRoom();
                this.chatService.hidePrivateChannelBox();
                this.chatService.deletePrivateChannel(this.currentRoom.roomId);
            } else {
                this.emitQuitWaitingRoom();
            }
            this.chatService.leavePrivateChannel(this.user.uid, this.currentRoom.roomId);
            this.resetWaitingRoom();
        } catch (err) {
            console.error(err);
        }

        this.router.navigate(['home']);
    }

    kickPlayer(player: PublicUserAccount) {
        if (!this.currentRoom) throw new Error('No room to kick player');
        this.socketService.emitEvent(ServerEvent.KickPlayer, { playerId: player.uid, ownerId: this.currentRoom.ownerId });
    }

    deleteWaitingRoom() {
        if (!this.currentRoom) throw new Error('No room to delete');
        this.socketService.emitEvent(ServerEvent.DeleteWaitingRoom, { ownerId: this.currentRoom.ownerId });
    }

    startGame() {
        this.socketService.emitEvent(ServerEvent.StartMultiGame);
        this.resetWaitingRoom();
    }

    emitQuitWaitingRoom() {
        if (!this.currentRoom) throw new Error('No room to quit');
        if (!this.user) throw new Error('No user to quit room');
        this.socketService.emitEvent(ServerEvent.QuitWaitingRoom, { ownerId: this.currentRoom.ownerId, playerId: this.user.uid });
    }

    resetWaitingRoom() {
        this.currentRoom = null;
    }

    private isClassicMode(room: WaitingRoomDTO): boolean {
        return room.mode === GameMode.Classic;
    }
}
