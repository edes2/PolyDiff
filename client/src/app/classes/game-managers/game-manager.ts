import { Injectable } from '@angular/core';
import { FlashManager } from '@app/classes/flash-manager';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { ReplayEvent } from '@app/interfaces/replay';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChatService } from '@app/services/communication/chat.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { ReplayService } from '@app/services/playing/replay.service';
import { GameMode } from '@common/enums/mode';
import { ClientEvent } from '@common/enums/socket-events';
import { EndGameInfo, PlayingInfo } from '@common/interfaces/game';
import { ImageSet } from '@common/interfaces/image';
import { UUIDType, UserAccount } from '@common/interfaces/user';
import { Vec2 } from '@common/interfaces/vec2';
import { Subject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export abstract class GameManager {
    playingInfo: PlayingInfo;
    user: UserAccount;
    timerString: string = '00:00';
    isCheat: boolean = false;
    clickActivated: boolean = false;
    intervalId: number;
    endGameObservable: Subject<EndGameInfo> = new Subject<EndGameInfo>();
    flashManager: FlashManager;
    imageSetBackup: ImageSet;
    isSolo: boolean = true;
    cheatDiffs: Vec2[] = [];
    protected timerSubscription: Subscription;
    protected eventSubscription: Subscription;

    // eslint-disable-next-line max-params
    constructor(
        public replayService: ReplayService,
        protected communicationService: CommunicationService,
        protected chatService: ChatService,
        protected socketService: SocketClientService,
        public authService: AuthService,
    ) {}

    get mode(): GameMode {
        return this.playingInfo.mode;
    }

    get nbPlayers(): number {
        return this.playingInfo.players.length;
    }

    isClassic(): boolean {
        return this.playingInfo.mode === GameMode.Classic;
    }

    async fetchPlayingInfo(ownerId: UUIDType) {
        return new Promise<void>((resolve) => {
            this.communicationService.getPlayingInfo(ownerId).subscribe((playingInfo: PlayingInfo) => {
                this.playingInfo = playingInfo;
                resolve();
            });
        });
    }

    getDiffCount(userId: UUIDType | undefined = undefined): number {
        userId = userId || this.user.uid;
        const player = this.playingInfo.players.find((p) => p.user.uid === userId);
        return player ? player.diffCount : 0;
    }

    updateImages(): void {
        this.flashManager.updateImages(this.imageSetBackup.leftUri, this.imageSetBackup.rightUri);
    }

    setFlashService(leftPlayArea: PlayAreaComponent, rightPlayArea: PlayAreaComponent) {
        this.flashManager = new FlashManager(leftPlayArea, rightPlayArea, this.communicationService);
    }

    resetInfoForReplay(): void {
        this.destroyCheat();
        this.timerString = '00:00';
        this.playingInfo.players.forEach((player) => (player.diffCount = 0));
        this.clickActivated = false;
        this.cheatDiffs = [];
    }

    unsubscribeFromObservables(): void {
        this.timerSubscription?.unsubscribe();
        this.eventSubscription?.unsubscribe();
    }

    destroyCheat(): void {
        this.isCheat = false;
        window.clearInterval(this.intervalId);
    }

    async toggleCheat() {
        if (!this.isCheat) {
            // this.replayService.addReplayEvent(ClientEvent.CheatMode, diffs);
            this.intervalId = await this.flashManager.flashPixelsByFrequency(this.cheatDiffs);
            // this.socketService.emitEvent(ServerEvent.CheatMode);
        } else {
            window.clearInterval(this.intervalId);
            // this.replayService.addReplayEvent(ClientEvent.StopCheat);
        }
        this.isCheat = !this.isCheat;
    }

    disableClicks(time: number) {
        this.clickActivated = false;
        setTimeout(() => {
            this.clickActivated = true;
        }, time);
    }

    resetCheat(): void {
        this.isCheat = false;
        window.clearInterval(this.intervalId);
        // this.socketService.emitEvent(ServerEvent.CheatMode);
    }

    async restartCheatAfterPause(): Promise<void> {
        if (this.isCheat) {
            this.intervalId = await this.flashManager.flashPixelsByFrequency(this.cheatDiffs);
        }
    }

    async setReplayMultiplier(multiplier: number, isReplayPaused: boolean): Promise<void> {
        this.flashManager.replayMultiplier = multiplier;
        if (this.isCheat && !isReplayPaused) {
            window.clearInterval(this.intervalId);
            this.intervalId = await this.flashManager.flashPixelsByFrequency(this.cheatDiffs);
        }
    }

    registerNewRating(cardId: string, newRating: number): void {
        this.communicationService.ratingPut(cardId, newRating).subscribe();
    }

    removeChat(): void {
        this.chatService.deletePrivateChannel(this.playingInfo.roomId);
    }

    resetReplayService(mode: GameMode): void {
        this.unsubscribeFromObservables();
        this.replayService = new ReplayService();
        this.replayService.setGameMode(mode);
        this.subscribeToObservables();
    }
    private subscribeToObservables(): void {
        this.timerSubscription = this.replayService.timerObservable.subscribe({
            next: (time: string) => {
                this.timerString = time;
            },
        });
        this.eventSubscription = this.replayService.eventObservable.subscribe({
            next: (event: ReplayEvent) => {
                this.mapReplayEvents(event);
            },
        });
    }

    private async mapReplayEvents(replayEvent: ReplayEvent): Promise<void> {
        switch (replayEvent.type) {
            case ClientEvent.Timer:
                this.timerString = replayEvent.arg;
                break;
            case ClientEvent.ErrorClick:
                this.flashManager.executeBadClick(replayEvent.arg);
                break;
            case ClientEvent.DifferenceFoundClick:
                await this.flashManager.executeGoodClick(replayEvent.arg);
                if (this.isCheat) {
                    window.clearInterval(this.intervalId);
                }
                break;
            case ClientEvent.EndGame:
                this.endGameObservable.next(replayEvent.arg);
                this.replayService.restartReplayTimer();
                break;
            case ClientEvent.UpdateDiffCount:
                // TODO: Implement
                // this.playingInfo.otherDiffFoundCount = replayEvent.arg; <-- to remove
                break;
            case ClientEvent.CheatMode:
                this.isCheat = true;
                this.cheatDiffs = replayEvent.arg;
                this.intervalId = await this.flashManager.flashPixelsByFrequency(replayEvent.arg);
                break;
            case ClientEvent.StopCheat:
                this.isCheat = false;
                window.clearInterval(this.intervalId);
                break;
        }
    }

    abstract initializeGame(ownerId: UUIDType, user: UserAccount): Promise<void>;
}
