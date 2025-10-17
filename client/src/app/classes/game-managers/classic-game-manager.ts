import { Injectable } from '@angular/core';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChatService } from '@app/services/communication/chat.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { ReplayService } from '@app/services/playing/replay.service';
import { ImageSet } from '@common/interfaces/image';
import { UUIDType, UserAccount } from '@common/interfaces/user';
import { Vec2 } from '@common/interfaces/vec2';
import { GameManager } from './game-manager';

@Injectable({
    providedIn: 'root',
})
export class ClassicGameManager extends GameManager {
    leftUrl: string;
    rightUrl: string;
    cardId: string;

    // eslint-disable-next-line max-params
    constructor(
        public replayService: ReplayService,
        protected communicationService: CommunicationService,
        protected chatService: ChatService,
        protected socketService: SocketClientService,
        public authService: AuthService,
    ) {
        super(replayService, communicationService, chatService, socketService, authService);
    }
    async initializeGame(ownerId: UUIDType, user: UserAccount): Promise<void> {
        this.user = user;
        await this.fetchPlayingInfo(ownerId);
        this.isSolo = this.playingInfo.players.length === 1;
        await this.getImageSetFromServer();
        this.resetReplayService(this.playingInfo.mode);
        this.clickActivated = true;
        this.communicationService.getCheat(ownerId).subscribe((cheat: Vec2[]) => {
            this.cheatDiffs = cheat;
        });
    }

    async getImageSetFromServer(): Promise<void> {
        if (!this.playingInfo.cardInfo) return;
        const cardId = this.playingInfo.cardInfo.id;
        return new Promise<void>((resolve) => {
            this.communicationService.imageSetByIdGet(cardId).subscribe((data: ImageSet) => {
                this.leftUrl = data.leftUri;
                this.rightUrl = data.rightUri;
                this.cardId = data.cardId;
                this.imageSetBackup = data;
                this.flashManager.updateImages(data.leftUri, data.rightUri);
                resolve();
            });
        });
    }
}
