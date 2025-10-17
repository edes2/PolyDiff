import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ZenFlashManager } from '@app/classes/zen-flash-manager';
import { ConfirmationComponent } from '@app/components/confirmation/confirmation.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { WelcomeZenDialogComponent } from '@app/components/welcome-zen-dialog/welcome-zen-dialog.component';
import { ZenPlayAreaComponent } from '@app/components/zen-play-area/zen-play-area.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { ZenModeService } from '@app/services/zen-mode/zen-mode.service';
import { GameMode } from '@common/enums/mode';
import { Music, MusicType } from '@common/interfaces/music';
import { OneDifferenceImageSet } from '@common/interfaces/one-difference-set';
import { ClickValidation } from '@common/interfaces/socket-communication';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-zen-game-page',
    templateUrl: './zen-game-page.component.html',
    styleUrls: ['./zen-game-page.component.scss'],
})
export class ZenGamePageComponent implements AfterViewInit, OnDestroy {
    @ViewChild('leftCanvas') leftPlayArea!: ZenPlayAreaComponent;
    @ViewChild('rightCanvas') rightPlayArea!: ZenPlayAreaComponent;

    mode: GameMode = GameMode.Zen;
    isDarkMode: boolean = true;
    musicPlayer: HTMLAudioElement = new Audio();

    private imageSet: OneDifferenceImageSet;
    private flashManager: ZenFlashManager;

    private musicFetchSubscription: Subscription | null = null;
    private welcomeDialogRef: MatDialogRef<WelcomeZenDialogComponent>;
    private quitConfirmationPopup: MatDialogRef<ConfirmationComponent> | null;

    // eslint-disable-next-line max-params
    constructor(
        readonly socketService: SocketClientService,
        private readonly router: Router,
        public dialog: MatDialog,
        private readonly zenModeService: ZenModeService,
        private communicationService: CommunicationService,
    ) {}

    ngAfterViewInit() {
        this.displayWelcomeDialog();
        this.handlePlayAreaClick();
        this.flashManager = new ZenFlashManager(this.leftPlayArea, this.rightPlayArea, this.communicationService);
        this.nextImage();
    }

    ngOnDestroy() {
        this.terminate();
    }

    nextImage() {
        const excludeIds = this.imageSet ? [this.imageSet.cardId] : undefined;
        this.musicFetchSubscription = this.zenModeService.getRandomImageSet(excludeIds).subscribe((imageSet: OneDifferenceImageSet) => {
            if (!imageSet) {
                this.openNoGamesPopup();
                return;
            }
            this.imageSet = imageSet;
            this.flashManager.updateImages(imageSet.leftUri, imageSet.rightUri);
            this.enableClicks();
        });
    }

    displayWelcomeDialog() {
        this.welcomeDialogRef = this.dialog.open(WelcomeZenDialogComponent, {
            width: '50vw',
            disableClose: true,
        });
        this.welcomeDialogRef.afterClosed().subscribe((result: MusicType) => {
            this.startMusic(result);
        });
    }

    handlePlayAreaClick() {
        for (const playArea of [this.leftPlayArea, this.rightPlayArea]) {
            playArea.mouseClick.subscribe((pos: ClickValidation) => {
                this.validateClick(pos);
            });
        }
    }

    startMusic(musicType: MusicType) {
        this.zenModeService.getRandomMusic(musicType).subscribe((music: Music) => {
            if (!music) {
                console.error('Unable to fetch music');
                return;
            }
            this.musicPlayer.src = music.src;
            this.musicPlayer.load();
            this.musicPlayer.play().catch((error) => console.error(error));

            this.musicPlayer.onended = () => {
                this.startMusic(musicType);
            };
        });
    }

    async validateClick(click: ClickValidation) {
        if (this.zenModeService.isSuccessfulClick(this.imageSet, click.position)) {
            this.disableClicks();
            await this.flashManager.executeGoodClick(this.imageSet.difference);
            this.nextImage();
        } else {
            this.flashManager.executeBadClick(click);
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
    }

    quitGame() {
        this.quitConfirmationPopup = this.dialog.open(ConfirmationComponent, {
            data: {
                message: 'Êtes-vous sûr de vouloir quitter?',
            },
        });
        this.quitConfirmationPopup.afterClosed().subscribe((choice: boolean) => {
            if (choice) {
                this.terminate();
                this.redirectHome();
            }
        });
    }

    stopMusic() {
        this.musicPlayer.pause();
        this.musicPlayer.currentTime = 0;
    }

    private enableClicks() {
        this.leftPlayArea.enableClick();
        this.rightPlayArea.enableClick();
    }

    private disableClicks() {
        this.leftPlayArea.disableClick();
        this.rightPlayArea.disableClick();
    }

    private unsubscribeFromObservables() {
        this.musicFetchSubscription?.unsubscribe();
    }

    private openNoGamesPopup() {
        const dialogRef = this.dialog.open(PopupMessageComponent, {
            data: {
                message: {
                    content: "Il semble qu'aucun jeu n'est actuellement disponible. Vous serez redirigé vers la page d'accueil",
                    leftButtonText: 'OK',
                    leftRouterLink: '/home',
                },
            },
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe(() => {
            this.redirectHome();
        });
    }

    private redirectHome() {
        this.router.navigate(['/home']);
    }

    private closeDialogs() {
        this.welcomeDialogRef?.close();
    }

    private terminate() {
        this.disableClicks();
        this.stopMusic();
        this.unsubscribeFromObservables();
        this.closeDialogs();
    }
}
