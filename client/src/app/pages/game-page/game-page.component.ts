import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CanThrowErrorPopup } from '@app/classes/can-throw-error';
import { GameManagerFactory } from '@app/classes/game-managers/game-managers-factory';
import { ConfirmationComponent } from '@app/components/confirmation/confirmation.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { RatingPopupComponent } from '@app/components/rating-popup/rating-popup.component';
import { ReplayComponent } from '@app/components/replay/replay.component';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChatService } from '@app/services/communication/chat.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { GameService } from '@app/services/game/game.service';
import { AnimationService } from '@app/services/playing/animation.service';
import { GameMode } from '@common/enums/mode';
import { ServerEvent } from '@common/enums/socket-events';
import { EndGameInfo } from '@common/interfaces/game';
import { UUIDType } from '@common/interfaces/user';
import { Subscription } from 'rxjs';
// eslint-disable-next-line no-restricted-imports
import { PlayerInGame } from '../../../../../server/app/interfaces/socket-services';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent extends CanThrowErrorPopup implements AfterViewInit, OnDestroy {
    @ViewChild('leftCanvas') leftPlayArea!: PlayAreaComponent;
    @ViewChild('rightCanvas') rightPlayArea!: PlayAreaComponent;
    @ViewChild('replay') replayComponent!: ReplayComponent;
    @ViewChild('animation') animationArea!: ElementRef;

    replayMultiplier: number = 1;
    isReplaying: boolean = false;
    isShortcutable: boolean = false;
    mode: GameMode;

    blurBackground: boolean = false;
    ownerId: string;

    quitters: PlayerInGame[] = [];

    private endGameSubscription: Subscription;
    private gameEnded: boolean = false;

    private leavingPopup: MatDialogRef<PopupMessageComponent> | null;
    private quitConfirmationPopup: MatDialogRef<ConfirmationComponent> | null;
    private ratingPopup: MatDialogRef<RatingPopupComponent> | null;

    private loserAudio = new Audio('assets/audio/loseSound.mp3');

    // Simply because this is the main component where every services get used
    // eslint-disable-next-line max-params
    constructor(
        readonly socketService: SocketClientService,
        private route: ActivatedRoute,
        private readonly animationService: AnimationService,
        private readonly authService: AuthService,
        private chatService: ChatService,
        private readonly gameManagerFactory: GameManagerFactory,
        private readonly gameService: GameService,
        protected readonly matDialog: MatDialog,
        protected readonly router: Router,
    ) {
        super(matDialog, router);

        try {
            const ownerId = this.route.snapshot.paramMap.get('gameOwnerId');
            this.mode = this.route.snapshot.queryParams.mode as GameMode;

            if (!ownerId) throw new Error('Il semble que vous ne soyez pas dans une salle de jeu');
            if (!this.mode) throw new Error('Il semble que vous ne soyez pas dans une salle de jeu');

            this.setGameManagerService(this.mode);

            this.ownerId = ownerId;
            this.initializeGameSession(ownerId).then(() => {
                this.endGameSubscription = this.manager.endGameObservable.subscribe({
                    next: (endGameInfo: EndGameInfo) => {
                        this.gameEnded = true;
                        this.openEndGamePopup(endGameInfo);
                    },
                });
            });
        } catch (error: any) {
            this.throwError(error.message);
        }
    }

    get manager() {
        return this.gameService.manager;
    }

    @HostListener('window:keyup', ['$event']) handleHintCheatEvents(event: KeyboardEvent) {
        // if (!this.isShortcutable) return; C'est pour le replay?
        if (event.key === 't') {
            if (document.activeElement) {
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    this.manager.toggleCheat();
                }
            } else {
                console.log('no active element');
            }
        }
    }

    setGameManagerService(mode: GameMode) {
        this.gameService.setGameManager(this.gameManagerFactory.getGameManager(mode));
    }

    ngAfterViewInit(): void {
        this.onSetFlashService();
        this.animationService.animationArea = this.animationArea;
    }

    async initializeGameSession(ownerId: UUIDType) {
        const user = this.authService.getUserInfo();
        if (!user) throw new Error('No user connected');
        await this.manager.initializeGame(ownerId, user);
        this.socketService.onEvent(ServerEvent.PlayerLeft, (leftPlayerUID: UUIDType) => {
            const player: PlayerInGame | undefined = this.manager.playingInfo.players.find((p) => p.user.uid === leftPlayerUID);
            this.manager.playingInfo.players = this.manager.playingInfo.players.filter((p) => p.user.uid !== leftPlayerUID);
            if (player) this.quitters.push(player);
        });
    }

    ngOnDestroy() {
        this.endGameSubscription?.unsubscribe();
        this.manager.unsubscribeFromObservables();
        this.manager.destroyCheat();
        this.closePopups();
        this.manager.flashManager.goodAnswerAudio.pause();
        this.manager.flashManager.badAnswerAudio.pause();
        this.handleChatClose();
        if (!this.gameEnded) this.socketService.emitEvent(ServerEvent.AbandonGame);
    }

    openQuitConfirmationPopup() {
        this.quitConfirmationPopup = this.matDialog.open(ConfirmationComponent, {
            data: {
                message: 'Êtes-vous sûr de vouloir quitter?',
            },
        });
        this.quitConfirmationPopup.afterClosed().subscribe((choice: boolean) => {
            if (choice) {
                this.handleChatClose();
                this.socketService.emitEvent(ServerEvent.AbandonGame);
                this.router.navigate(['/options'], { queryParams: { mode: this.manager.playingInfo.mode } });
            }
        });
    }

    handleChatClose() {
        const uid = this.authService.getUserInfo()?.uid;
        if (!uid) throw new Error('No user connected');
        this.chatService.hidePrivateChannelBox();
        this.chatService.leavePrivateChannel(uid, this.manager.playingInfo.roomId);
        if (this.manager.playingInfo.players.length === 1) {
            this.manager.removeChat();
        }
    }

    onSetFlashService(): void {
        this.manager.setFlashService(this.leftPlayArea, this.rightPlayArea);
    }

    getName(): string {
        return this.mode === GameMode.Classic ? 'Mode Classique' : 'Mode limité';
    }

    openEndGamePopup(endGameInfo: EndGameInfo) {
        const user = this.authService.getUserInfo();
        if (!user) throw new Error('No user connected');

        let hasWon = false;
        let endMessage = '';

        switch (this.mode) {
            case GameMode.Classic:
                hasWon = !!endGameInfo.winner && endGameInfo.winner.uid === user.uid;
                endMessage = hasWon ? 'Félicitations vous avez gagné!' : 'Vous avez perdu!';
                break;
            case GameMode.LimitedTime:
                hasWon = endGameInfo.isTimeout !== undefined && !endGameInfo.isTimeout;
                endMessage = hasWon ? 'Bravo, vous avez réussi!' : 'Le temps est écoulé, vous avez perdu!';
                break;
            default:
                throw new Error('Invalid game mode');
        }

        if (hasWon) {
            this.animationService.startRain();
        } else {
            this.loserAudio.load();
            this.loserAudio.play();
        }

        this.leavingPopup = this.matDialog.open(PopupMessageComponent, {
            disableClose: true,
            data: {
                message: {
                    content: endMessage,
                    leftButtonText: 'Quitter',
                    leftRouterLink: this.mode === GameMode.LimitedTime ? '/home' : undefined,
                    rightButtonText: this.mode === GameMode.Classic ? 'Reprise' : undefined,
                    rightRouterLink: undefined,
                },
            },
        });

        this.leavingPopup.afterOpened().subscribe(() => {
            this.handleChatClose();
        });

        this.leavingPopup.afterClosed().subscribe((choice: number) => {
            this.animationService.clearRain();
            this.loserAudio.pause();
            const chooseReplay = choice === 2;
            if (chooseReplay) {
                this.replayComponent.initReplay();
            } else {
                if (this.mode === GameMode.Classic) {
                    this.ratingPopup = this.matDialog.open(RatingPopupComponent, {
                        disableClose: true,
                    });
                    this.ratingPopup.afterClosed().subscribe((userRating: number) => {
                        this.router.navigate(['/home']);
                        if (!this.manager.playingInfo.cardInfo) return;
                        this.manager.registerNewRating(this.manager.playingInfo.cardInfo.id, userRating);
                    });
                }
            }
        });
    }

    onShortcutChange(isShortcutable: boolean): void {
        this.isShortcutable = isShortcutable;
    }

    onMultiplierChange(multiplier: number): void {
        this.replayMultiplier = multiplier;
    }

    onReplayingChange(isReplaying: boolean): void {
        this.isReplaying = isReplaying;
    }

    hasQuit(uid: UUIDType): boolean {
        return this.quitters.some((p) => p.user.uid === uid);
    }

    private closePopups() {
        this.quitConfirmationPopup?.close(false);
        this.leavingPopup?.close(0);
        this.ratingPopup?.close();
    }
}
