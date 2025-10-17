import { Injectable } from '@angular/core';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChatService } from '@app/services/communication/chat.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { ReplayService } from '@app/services/playing/replay.service';
import { GameMode } from '@common/enums/mode';
import { ClassicGameManager } from './classic-game-manager';
import { LimitedGameManager } from './limited-game-manager';

export type ConcreteGameManager = ClassicGameManager | LimitedGameManager;

@Injectable({
    providedIn: 'root',
})
export class GameManagerFactory {
    services: [ReplayService, CommunicationService, ChatService, SocketClientService];

    // eslint-disable-next-line max-params
    constructor(
        private replayService: ReplayService,
        private communicationService: CommunicationService,
        private chatService: ChatService,
        private socketService: SocketClientService,
        private authService: AuthService,
    ) {
        this.services = [this.replayService, this.communicationService, this.chatService, this.socketService];
    }

    getGameManager(mode: GameMode): ConcreteGameManager {
        switch (mode) {
            case GameMode.Classic:
                return new ClassicGameManager(...this.services, this.authService);
            case GameMode.LimitedTime:
                return new LimitedGameManager(...this.services, this.authService);
            default:
                throw new Error('Invalid mode');
        }
    }
}
