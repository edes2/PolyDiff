import { Injectable } from '@angular/core';
import { ConcreteGameManager } from '@app/classes/game-managers/game-managers-factory';
import { UUIDType, UserAccount } from '@common/interfaces/user';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    manager: ConcreteGameManager;

    get replayService() {
        return this.manager.replayService;
    }

    get flashService() {
        return this.manager.flashManager;
    }

    get playingInfo() {
        return this.manager.playingInfo;
    }

    get isCheat() {
        return this.manager.isCheat;
    }

    get endGameObservable() {
        return this.manager.endGameObservable;
    }

    setGameManager(manager: ConcreteGameManager) {
        this.manager = manager;
    }

    setTimer(time: string) {
        this.manager.timerString = time;
    }

    resetCheat() {
        this.manager.resetCheat();
    }

    disableClicks(delay: number) {
        this.manager.disableClicks(delay);
    }

    setActivated(activated: boolean) {
        this.manager.clickActivated = activated;
    }

    removeChat() {
        this.manager.removeChat();
    }
    async initializeGame(ownerId: UUIDType, user: UserAccount) {
        await this.manager.initializeGame(ownerId, user);
    }
}
