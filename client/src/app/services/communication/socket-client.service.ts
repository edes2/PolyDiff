import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@app/../environments/environment';
import { FlashManager } from '@app/classes/flash-manager';
import { GameService } from '@app/services/game/game.service';
import { ReplayService } from '@app/services/playing/replay.service';
import { ONE_SECOND_IN_MS } from '@common/constants/time';
import { GameMode } from '@common/enums/mode';
import { ClientEvent, ServerEvent } from '@common/enums/socket-events';
import { EndGameInfo } from '@common/interfaces/game';
import { ClickValidation } from '@common/interfaces/socket-communication';
import { Vec2 } from '@common/interfaces/vec2';
import { Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';

// const DIFFERENCE_COUNT_ERROR = -1;

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    playModeObservable: Subject<void> = new Subject<void>();
    private socket: Socket;

    // eslint-disable-next-line max-params
    constructor(public gameService: GameService, private router: Router) {}

    get replayService(): ReplayService {
        return this.gameService.replayService;
    }

    get flashService(): FlashManager {
        return this.gameService.flashService;
    }

    isConnected(): boolean {
        return !!this.socket && this.socket.connected;
    }

    // Because we want to refresh game when a new one is added.
    // Therefore, string and GameInfo are used as parameter for the arrow function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refreshEventHandler(event: string, handler: (arg: any) => void): void {
        if (this.socket.hasListeners(event)) {
            this.socket.removeListener(event);
        }
        this.socket.on(event, handler);
    }

    // The data must be a single parameter and the types that can be send are limited
    emitEvent(event: string, arg?: any, callback?: (arg: any) => void): void {
        this.socket.emit(event, arg, callback);
    }
    emitEventWithGameInfo(event: string): void {
        this.socket.emit(event);
    }

    emitEventWithCurrentPlayingInfo(event: string): void {
        this.socket.emit(event, this.gameService.playingInfo);
    }

    onEvent(event: string, handler: (arg: any) => void): void {
        this.socket.on(event, handler);
    }

    offEvent(event: string): void {
        this.socket.off(event);
    }

    async initConnection(token: string): Promise<boolean> {
        this.socket = io(environment.mainServerUrl.replace('api', ''), { transports: ['websocket'], upgrade: false, autoConnect: false });
        this.socket.connect();
        this.configureBaseFeatures();
        this.socket.emit(ServerEvent.Authentification, token);
        return new Promise((resolve) => {
            this.socket.on(ClientEvent.AuthentificationComplete, (success: boolean) => {
                resolve(success);
            });
        });
    }

    disconnect(): void {
        this.socket.disconnect();
    }

    private configureBaseFeatures(): void {
        this.socket.on(ClientEvent.Timer, (time: string) => {
            this.gameService.setTimer(time);
            this.replayService.addReplayEvent(ClientEvent.Timer, time);
        });

        this.socket.on(ClientEvent.ErrorClick, (clickValidation: ClickValidation) => {
            this.gameService.disableClicks(ONE_SECOND_IN_MS);
            this.flashService.executeBadClick(clickValidation);
            this.replayService.addReplayEvent(ClientEvent.ErrorClick, clickValidation);
        });

        this.socket.on(ClientEvent.DifferenceFoundClick, async (difference: Vec2[]) => {
            this.replayService.addReplayEvent(ClientEvent.DifferenceFoundClick, difference);
            await this.flashService.executeGoodClick(difference);
            // Pour bloquer les clicks en limited time:
            if (this.gameService.manager.mode === GameMode.LimitedTime) {
                this.gameService.manager.clickActivated = false;
            }
            if (this.gameService.isCheat) {
                this.gameService.resetCheat();
            }
        });

        this.socket.on(ClientEvent.StopClicks, () => {
            this.gameService.setActivated(false);
        });

        this.socket.on(ClientEvent.EndGame, (endGameInfo: EndGameInfo) => {
            this.gameService.removeChat();
            this.gameService.endGameObservable.next(endGameInfo);
            this.replayService.endRecording(endGameInfo);
        });

        this.socket.on(ClientEvent.UpdateDiffCount, (entries: any) => {
            // const counts: Map<UUIDType, number> = new Map(entries.map((entry) => [entry[0], entry[1].count]));
            // map gameService.playingInfo.players to entries which are an array of maps of uuid to diffcount
            // this.gameService.playingInfo.players.forEach((player) => {
            //     player.diffCount = entries[0].get(player.user.uid) ?? DIFFERENCE_COUNT_ERROR;
            //     console.log(player.diffCount);
            // });
            this.gameService.playingInfo.players.forEach((player) => {
                entries.forEach((entry: any) => {
                    if (entry[0] === player.user.uid) {
                        player.diffCount = entry[1].count;
                    }
                });
            });
            this.replayService.addReplayEvent(ClientEvent.UpdateDiffCount, entries);
        });

        // eslint-disable-next-line no-unused-vars

        // this.socket.on(ClientEvent.CheatMode, async (diffs: Vec2[]) => {
        //     this.replayService.addReplayEvent(ClientEvent.CheatMode, diffs);
        //     this.gameManagerService.intervalId = await this.flashService.flashPixelsByFrequency(diffs);
        // });

        this.socket.on(ClientEvent.StartOfGame, () => {
            this.replayService.saveGameStartTimestamp();
            // this.gameManagerService.getSettingsFromServer();
        });

        // FIXME: On pourrait éviter cet evenement en envoyant dès le début de la partie (gameId devient une liste?)
        // this.socket.on(ClientEvent.NextGameId, (gameId: string) => {
        //     this.gameManagerService.playingInfo.gameId = gameId;
        //     this.gameManagerService.getImageSetFromServer();
        //     this.gameManagerService.getGameInfoFromServer();
        // });

        // this.socket.on(ClientEvent.TeammateLeft, () => {
        //     this.playModeObservable.next();
        // });

        this.socket.on(ClientEvent.GameStarted, (gameInfo) => {
            this.router.navigate([`game/multi/${gameInfo.ownerId}`]);
        });
    }
}
