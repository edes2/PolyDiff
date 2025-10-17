import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '@app/components/alert/alert.component';
import { ConfirmationComponent } from '@app/components/confirmation/confirmation.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SECONDS_IN_MINUTE } from '@common/constants/time';
import { EnrichedCardInfo } from '@common/interfaces/card-info';
import { UUIDType } from '@common/interfaces/user';

@Component({
    selector: 'app-config-card',
    templateUrl: './config-card.component.html',
    styleUrls: ['./config-card.component.scss'],
})
export class ConfigCardComponent implements OnInit {
    @Input() cardId!: UUIDType;
    @ViewChild('image', { static: false }) private image!: ElementRef<HTMLImageElement>;

    cardInfo: EnrichedCardInfo;
    cardName: string;

    // eslint-disable-next-line max-params
    constructor(
        private readonly communicationService: CommunicationService,
        private matDialog: MatDialog,
        private changeDetector: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.communicationService.cardInfoByIdGet(this.cardId).subscribe((cardInfo) => {
            this.cardInfo = cardInfo;
            this.displayName();
            this.displayImage();
        });
    }

    displayName(): void {
        const desiredLength = 20;
        this.cardName = this.cardInfo.name.substring(0, desiredLength);
        if (this.cardInfo.name.length > desiredLength) this.cardName += '...';
    }

    async displayImage() {
        this.changeDetector.detectChanges();
        this.communicationService.imageMiniatureGet(this.cardId).subscribe((image) => {
            if (image) {
                this.image.nativeElement.src = image;
            }
        });
    }

    openConfirmationPopupDeleteCard(cardId: string) {
        const dialogRef = this.matDialog.open(ConfirmationComponent, {
            data: {
                message: 'Êtes-vous certain de vouloir supprimer cette fiche de jeu ?',
            },
        });
        dialogRef.afterClosed().subscribe((choice: boolean) => {
            if (choice) {
                this.handleDeleteCard(cardId);
            }
        });
    }

    openConfirmationPopupResetScores(cardId: string) {
        const dialogRef = this.matDialog.open(ConfirmationComponent, {
            data: {
                message: 'Êtes-vous certain de vouloir réinitialiser les meilleurs temps de cette fiche ?',
            },
        });
        dialogRef.afterClosed().subscribe((choice: boolean) => {
            if (choice) {
                this.handleResetScoreCard(cardId);
            }
        });
    }

    handleResetScoreCard(cardId: string) {
        this.communicationService.cardResetScoresPut(cardId).subscribe((response) => {
            if (response.ok) {
                this.ngOnInit();
            } else {
                this.matDialog.open(AlertComponent, {
                    data: { message: 'Une erreur est survenue durant la réinitialisation des meilleurs temps.' },
                });
            }
        });
    }

    handleDeleteCard(cardId: string) {
        this.communicationService.cardDelete(cardId).subscribe((response) => {
            if (!response.ok) {
                this.matDialog.open(AlertComponent, {
                    data: { message: 'Une erreur est survenue durant la suppresion de la fiche de jeu.' },
                });
            }
        });
    }

    convertSecondsToTime(seconds: number): string {
        const minutes = Math.floor(seconds / SECONDS_IN_MINUTE);
        const remainingSeconds = seconds % SECONDS_IN_MINUTE;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}
