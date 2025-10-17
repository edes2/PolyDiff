import { Injectable } from '@angular/core';
import { ReplayEvent } from '@app/interfaces/replay';
import { GameMode } from '@common/enums/mode';
import { ClientEvent } from '@common/enums/socket-events';
import { EndGameInfo } from '@common/interfaces/game';
import { ImageSet } from '@common/interfaces/image';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ReplayService {
    tempImageSet: ImageSet;

    timerObservable: Subject<string> = new Subject<string>();
    eventObservable: Subject<ReplayEvent> = new Subject<ReplayEvent>();
    gameStartTimestamp: number;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    precision: number = 100;
    gameDurationValue: number;
    private gameMode: GameMode;
    private events: ReplayEvent[] = [];
    private eventPointer: number = 0;
    // Number of "precision" ms increments since the start of the replay
    private replayTimerValue: number = 0;
    private replayTimer: ReturnType<typeof setInterval>;

    get gameDuration() {
        return this.gameDurationValue;
    }

    get replayTime() {
        return this.replayTimerValue;
    }

    setGameMode(gameMode: GameMode): void {
        this.saveGameStartTimestamp(); // Je l'appel ici car cette fonction est appelée avec la bonne reference.
        this.gameMode = gameMode;
    }

    saveGameStartTimestamp(): void {
        // Cette fonction est appellee a un moment mais avec la reference d un autre replay service !
        if (this.gameMode === GameMode.LimitedTime) return;
        this.events = [];
        this.gameStartTimestamp = Date.now();
    }

    // eslint-disable-next-line no-unused-vars
    endRecording(endGameInfo: EndGameInfo): void {
        this.addReplayEvent(ClientEvent.EndGame, endGameInfo);
        this.gameDurationValue = (Date.now() - this.gameStartTimestamp) / this.precision;
    }

    startReplay(multiplier: number): void {
        this.replayTimer = setInterval(() => {
            this.doEachIncrement();
        }, this.precision / multiplier);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addReplayEvent(type: ClientEvent, arg?: any): void {
        if (this.gameMode === GameMode.LimitedTime || this.gameMode === GameMode.Zen) return;
        const replayEvent: ReplayEvent = {
            time: this.calculateGameTime(),
            type,
            arg,
        };
        this.events.push(replayEvent);
    }

    stopReplayTimer(): void {
        clearInterval(this.replayTimer);
    }

    restartReplayTimer(): void {
        clearInterval(this.replayTimer);
        this.replayTimerValue = 0;
        this.eventPointer = 0;
    }

    clearAllIntervals(): void {
        clearInterval(this.replayTimer);
    }

    private calculateGameTime(): number {
        const timeElapsedInMs = Date.now() - this.gameStartTimestamp;
        return Math.round(timeElapsedInMs / this.precision);
    }

    private doEachIncrement(): void {
        this.replayTimerValue++;
        this.executeEvents();
    }

    private executeEvents(): void {
        let currentEvent: ReplayEvent = this.events[this.eventPointer];
        while (currentEvent && currentEvent.time === this.replayTimerValue) {
            this.eventPointer++;
            this.eventObservable.next(currentEvent);
            currentEvent = this.events[this.eventPointer];
        }
    }
}
