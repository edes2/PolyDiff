import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CreationMultiComponent } from '@app/components/creation-multi/creation-multi.component';
import { CardsService } from '@app/services/cards/cards.service';
import { RoomsService } from '@app/services/rooms/rooms.service';
import { GameMode } from '@common/enums/mode';
import { GameConfig } from '@common/interfaces/game-config';

const MIN_CARD_COUNT_FOR_LIMITED = 2;

enum GameOptions {
    Solo,
    Create,
    Join,
}

@Component({
    selector: 'app-options-page',
    templateUrl: './options-page.component.html',
    styleUrls: ['./options-page.component.scss'],
})
export class OptionsPageComponent implements OnInit {
    gameSelection: GameMode;
    gameOptions = GameOptions;
    errorMessage: string = '';

    // eslint-disable-next-line max-params
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private matDialog: MatDialog,
        private readonly cardsService: CardsService,
        private readonly roomsService: RoomsService,
    ) {}

    ngOnInit(): void {
        this.gameSelection = this.getGameModeFromUrl();
    }

    redirectToSelection(gameSelection: GameOptions): void {
        switch (gameSelection) {
            case GameOptions.Solo:
                if (this.gameSelection === GameMode.LimitedTime) {
                    // go directly to game page
                } else {
                    this.router.navigate(['/selection'], { queryParams: { isMultiplayer: false } });
                }
                break;

            case GameOptions.Join:
                if (this.gameSelection === GameMode.LimitedTime) {
                    this.router.navigate(['/join/multi'], { queryParams: { mode: GameMode.LimitedTime } });
                } else {
                    this.router.navigate(['/join/multi'], { queryParams: { mode: GameMode.Classic } });
                }
                break;
            case GameOptions.Create:
                if (this.gameSelection === GameMode.LimitedTime) {
                    this.startLimitedGameCreation();
                } else {
                    this.router.navigate(['/create/game'], { queryParams: { mode: GameMode.Classic } });
                }
                break;
        }
    }

    isModeAvailable(): boolean {
        if (this.gameSelection === GameMode.LimitedTime && this.cardsService.getCardCount() < MIN_CARD_COUNT_FOR_LIMITED) {
            this.errorMessage = `Il n'y a pas assez de fiches pour ce mode de jeu (minimum ${MIN_CARD_COUNT_FOR_LIMITED})`;
            return false;
        }
        this.errorMessage = '';
        return true;
    }

    private getGameModeFromUrl(): GameMode {
        const mode = this.route.snapshot.queryParams.mode;
        if (mode === GameMode.Classic) return GameMode.Classic;
        if (mode === GameMode.LimitedTime) return GameMode.LimitedTime;
        throw new Error('Invalid game mode');
    }

    private startLimitedGameCreation(): void {
        const dialogRef = this.matDialog.open(CreationMultiComponent, {
            data: {
                message: 'Configurer la partie',
                routerLink: undefined,
            },
        });
        dialogRef.componentInstance.mode = GameMode.LimitedTime;

        dialogRef.afterClosed().subscribe((choice) => {
            if (choice) {
                this.handleStartingLimitedGame(choice.duration, choice.cheatingMode, choice.limitedBonus);
            }
        });
    }

    private handleStartingLimitedGame(duration: number, cheatingAllowed: boolean, limitedBonus: number) {
        const config: GameConfig = {
            mode: GameMode.LimitedTime,
            duration,
            cheatingAllowed,
            timeBonus: limitedBonus,
        };
        this.roomsService.createRoom(config);
    }
}
