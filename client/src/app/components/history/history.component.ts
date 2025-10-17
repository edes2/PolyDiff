import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationComponent } from '@app/components/confirmation/confirmation.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { EnrichedGameHistory } from '@common/interfaces/history';

@Component({
    selector: 'app-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
    gamesHistory: EnrichedGameHistory[];

    constructor(
        private matDialog: MatDialog,
        private matDialogRef: MatDialogRef<HistoryComponent>,
        private readonly communicationService: CommunicationService,
    ) {}

    ngOnInit(): void {
        this.communicationService.allGamesHistoryGet().subscribe((gamesHistory) => {
            this.gamesHistory = gamesHistory;
        });
    }

    exitPopup(): void {
        this.matDialogRef.close();
    }

    confirmDelete(): void {
        const dialogRef = this.matDialog.open(ConfirmationComponent, {
            data: {
                message: "Êtes-vous certain de vouloir supprimer l'historique des parties ?",
            },
        });
        dialogRef.afterClosed().subscribe((choice: boolean) => {
            if (choice) {
                this.deleteHistory();
            }
        });
    }

    // classFirstRankedUsername(gameHistory: GameHistory): string {
    //     // if (this.firstPlayerHasQuit(gameHistory)) {
    //     //     return 'gave-up';
    //     // } else if (this.firstPlayerHasWin(gameHistory)) {
    //     //     return 'winner';
    //     // }
    //     return '';
    // }

    // classSecondRankedUsername(gameHistory: GameHistory): string {
    //     // if (this.secondPlayerHasQuit(gameHistory)) {
    //     //     return 'gave-up';
    //     // } else if (this.secondPlayerHasWin(gameHistory)) {
    //     //     return 'winner';
    //     // }
    //     return '';
    // }

    disableDefaultFocus(event: KeyboardEvent): void {
        event.preventDefault();
    }

    private deleteHistory(): void {
        this.communicationService.allGamesHistoryDelete().subscribe();
        this.gamesHistory.length = 0;
    }

    // private isSoloGame(gameHistory: GameHistory): boolean {
    //     return gameHistory.gameMode === GameMode.ClassicSolo || gameHistory.gameMode === GameMode.LimitedSolo;
    // }

    // private isMultiGame(gameHistory: GameHistory): boolean {
    //     return gameHistory.gameMode === GameMode.ClassicMulti || gameHistory.gameMode === GameMode.LimitedCoop;
    // }
}
