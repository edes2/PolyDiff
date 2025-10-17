import { Component, OnInit } from '@angular/core';
import { AlertComponent } from '@app/components/alert/alert.component';
import { ConfirmationComponent } from '@app/components/confirmation/confirmation.component';
import { HistoryComponent } from '@app/components/history/history.component';
// import { SettingComponent } from '@app/components/setting/setting.component';
import { BaseGameFormComponent } from '@app/pages/base-game-form/base-game-form.component';

@Component({
    selector: 'app-config-page',
    templateUrl: './config-page.component.html',
    styleUrls: ['./config-page.component.scss'],
})
export class ConfigPageComponent extends BaseGameFormComponent implements OnInit {
    ngOnInit(): void {
        super.ngOnInit();
    }

    openGameHistoryPopup(): void {
        this.matDialog.open(HistoryComponent);
    }

    // openSettingPopup(): void {
    //     this.matDialog.open(SettingComponent);
    // }

    openCardResetAllScoresPopup(): void {
        const dialogRef = this.matDialog.open(ConfirmationComponent, {
            data: {
                message: 'Êtes-vous certain de vouloir réinitialiser les meilleurs temps de toutes les fiches ?',
            },
        });
        dialogRef.afterClosed().subscribe((choice: boolean) => {
            if (choice) {
                this.communicationService.allCardsResetScoresPut().subscribe((response) => {
                    if (response.ok) {
                        this.ngOnInit();
                    } else {
                        this.matDialog.open(AlertComponent, {
                            data: { message: 'Une erreur est survenue durant la réinitialisation des meilleurs temps.' },
                        });
                    }
                });
            }
        });
    }

    openCardDeleteAllPopup(): void {
        const dialogRef = this.matDialog.open(ConfirmationComponent, {
            data: {
                message: 'Êtes-vous certain de vouloir supprimer toutes les fiches de jeu ?',
            },
        });
        dialogRef.afterClosed().subscribe((choice: boolean) => {
            if (choice) {
                this.communicationService.allCardDelete().subscribe((response) => {
                    if (!response.ok) {
                        this.matDialog.open(AlertComponent, {
                            data: { message: 'Une erreur est survenue durant la supression de toutes les fiches de jeu.' },
                        });
                    }
                });
            }
        });
    }
}
