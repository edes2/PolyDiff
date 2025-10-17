import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConcreteGameManager } from '@app/classes/game-managers/game-managers-factory';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { GameService } from '@app/services/game/game.service';
import { ReplayService } from '@app/services/playing/replay.service';

@Component({
    selector: 'app-replay',
    templateUrl: './replay.component.html',
    styleUrls: ['./replay.component.scss'],
})
export class ReplayComponent {
    @Input() isReplaying: boolean;
    @Input() replayMultiplier: number;
    @Output() setFlashService = new EventEmitter<void>();
    @Output() replayMultiplierChange = new EventEmitter<number>();
    @Output() isReplayingChange = new EventEmitter<boolean>();
    @Output() isShortcutableChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    isReplayPaused: boolean = false;

    constructor(public socketService: SocketClientService, public gameService: GameService) {}

    get gameManager(): ConcreteGameManager {
        return this.gameService.manager;
    }

    get replayService(): ReplayService {
        return this.gameManager.replayService;
    }

    replayButtonClick(): void {
        this.replayService.restartReplayTimer();
        this.initReplay();
    }

    togglePause(): void {
        this.isReplayPaused = !this.isReplayPaused;
        if (this.isReplayPaused) {
            clearInterval(this.gameManager.intervalId);
            this.replayService.stopReplayTimer();
        } else {
            this.gameManager.restartCheatAfterPause();
            this.replayService.startReplay(this.replayMultiplier);
        }
    }

    changeReplaySpeed(multiplier: number): void {
        if (multiplier !== this.replayMultiplier) {
            this.replayMultiplierChange.emit(multiplier);
            this.gameManager.setReplayMultiplier(multiplier, this.isReplayPaused);
            this.replayService.stopReplayTimer();
            if (!this.isReplayPaused) this.replayService.startReplay(multiplier);
        }
    }

    async initReplay() {
        this.gameManager.updateImages();
        this.gameManager.resetInfoForReplay();
        this.setFlashService.emit();
        this.gameManager.setReplayMultiplier(this.replayMultiplier, this.isReplayPaused);
        this.isReplayingChange.emit(true);
        this.isShortcutableChange.emit(false);
        this.isReplayPaused = false;
        this.replayService.startReplay(this.replayMultiplier);
    }
}
