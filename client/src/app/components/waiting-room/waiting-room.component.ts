import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CanThrowErrorPopup } from '@app/classes/can-throw-error';
import { AuthService } from '@app/services/authentification/auth.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { RoomsService } from '@app/services/rooms/rooms.service';
import { GameMode } from '@common/enums/mode';
import { ClientEvent, ServerEvent } from '@common/enums/socket-events';
import { EnrichedCardInfo } from '@common/interfaces/card-info';
import { PublicUserAccount, UUIDType, UserAccount } from '@common/interfaces/user';
import { WaitingRoomDTO } from '@common/interfaces/waiting-room';

@Component({
    selector: 'app-waiting-room',
    templateUrl: './waiting-room.component.html',
    styleUrls: ['./waiting-room.component.scss'],
})
export class WaitingRoomPageComponent extends CanThrowErrorPopup implements OnDestroy {
    roomInfo: WaitingRoomDTO;
    user: UserAccount;

    // eslint-disable-next-line max-params
    constructor(
        public roomsService: RoomsService,
        private socketService: SocketClientService,
        private authService: AuthService,
        protected matDialog: MatDialog,
        protected router: Router,
    ) {
        super(matDialog, router);

        try {
            if (!this.roomsService.currentRoomInfo) throw new Error("La salle de jeu n'existe plus");
            const userInfo = this.authService.getUserInfo();
            if (!userInfo) throw new Error("Vous n'êtes pas connecté");
            this.user = userInfo;
            this.roomInfo = this.roomsService.currentRoomInfo;
            this.handleSocketEvents();
        } catch (error: any) {
            console.log("Error in waiting room's constructor: ", error.message);
            this.throwError(error.message);
        }
    }

    private get roomPlayersUpdateEvent(): string {
        return ClientEvent.UpdateRoomPlayers + this.roomInfo.ownerId;
    }

    ngOnDestroy(): void {
        this.stopListeningToSocketEvents();
    }

    quit(): void {
        this.roomsService.quitRoom();
    }

    startGame(): void {
        this.roomsService.startGame();
    }

    isFull(): boolean {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        return this.roomInfo.players && this.roomInfo.players.length > 4;
    }

    isOwner(uid: UUIDType): boolean {
        return this.roomInfo.ownerId === uid;
    }

    private handleSocketEvents(): void {
        this.socketService.onEvent(this.roomPlayersUpdateEvent, (players: any) => {
            this.roomInfo.players = players as PublicUserAccount[];
        });

        this.socketService.onEvent(ClientEvent.GameStarted, (gameInfo: any) => {
            this.stopListeningToSocketEvents();
            this.roomsService.resetWaitingRoom();
            this.router.navigate([`game/multi/${gameInfo.ownerId}`], { queryParams: { mode: gameInfo.mode } });
        });

        this.socketService.onEvent(ServerEvent.KickPlayer, (data) => {
            if (data.playerId === this.user.uid && data.ownerId === this.roomInfo.ownerId) {
                this.throwError("Cette salle de jeu n'est plus disponible");
            }
        });

        this.socketService.onEvent(ServerEvent.CardsUpdated, (cards: EnrichedCardInfo[]) => {
            if (this.roomInfo.mode === GameMode.LimitedTime && cards.length < 2) {
                this.throwError("Il n'y a pas assez de cartes pour jouer à ce mode");
            }
        });

        this.socketService.onEvent(ServerEvent.RoomCanceled, (roomId: string) => {
            if (this.roomInfo.roomId === roomId) {
                this.throwError("La salle de jeu n'existe plus");
            }
        });

        this.socketService.onEvent(this.roomPlayersUpdateEvent, (players: any) => {
            this.roomInfo.players = players as PublicUserAccount[];
        });
    }

    private stopListeningToSocketEvents(): void {
        if (this.roomInfo) this.socketService.offEvent(this.roomPlayersUpdateEvent);
        this.socketService.offEvent(ClientEvent.GameStarted);
        this.socketService.offEvent(ServerEvent.KickPlayer);
        this.socketService.offEvent(ServerEvent.CardsUpdated);
        this.socketService.offEvent(ServerEvent.RoomCanceled);
    }
}
