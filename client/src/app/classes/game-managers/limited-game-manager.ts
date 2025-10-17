import { Injectable } from '@angular/core';
import { GameManager } from '@app/classes/game-managers/game-manager';
import { ClientEvent } from '@common/enums/socket-events';
import { ImageSet } from '@common/interfaces/image';
import { UUIDType, UserAccount } from '@common/interfaces/user';
import { Vec2 } from '@common/interfaces/vec2';

@Injectable({
    providedIn: 'root',
})
export class LimitedGameManager extends GameManager {
    private imagesSets: ImageSet[] = [];
    private currentImageSetIndex: number | null = null;

    get currentImageSet(): ImageSet | undefined {
        return this.currentImageSetIndex !== null ? this.imagesSets[this.currentImageSetIndex] : undefined;
    }

    async initializeGame(ownerId: UUIDType, user: UserAccount): Promise<void> {
        this.user = user;
        await this.fetchPlayingInfo(ownerId);

        this.isSolo = this.playingInfo.players.length === 1;

        this.socketService.onEvent(ClientEvent.MoveNextSet, (imageSet: ImageSet) => {
            this.clickActivated = true;
            this.currentImageSetIndex = this.currentImageSetIndex === null ? 0 : this.currentImageSetIndex + 1;
            this.imagesSets.push(imageSet);
            this.updateImages();
            this.setUpCheat(ownerId);
        });

        this.resetReplayService(this.playingInfo.mode);
        // this.replayService.tempImageSet = this.imageSetBackup;

        this.clickActivated = true;
    }

    setUpCheat(ownerId: UUIDType): void {
        this.communicationService.getCheat(ownerId).subscribe((cheat: Vec2[]) => {
            this.cheatDiffs = cheat;
        });
    }

    updateImages(): void {
        if (!this.currentImageSet) return;
        this.imageSetBackup = this.currentImageSet;
        this.flashManager.updateImages(this.currentImageSet.leftUri, this.currentImageSet.rightUri);
    }

    async getImageSetFromServer(): Promise<void> {
        if (!this.playingInfo.cardInfo) return;
        const cardId = this.playingInfo.cardInfo.id;
        return new Promise<void>((resolve) => {
            this.communicationService.imageSetByIdGet(cardId).subscribe((data: ImageSet) => {
                this.imageSetBackup = data;
                this.flashManager.updateImages(data.leftUri, data.rightUri);
                resolve();
            });
        });
    }
}
