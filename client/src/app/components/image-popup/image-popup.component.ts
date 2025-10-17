import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CardsService } from '@app/services/cards/cards.service';
import { CardCreationInfo } from '@common/interfaces/card-info';

@Component({
    selector: 'app-image-popup',
    templateUrl: './image-popup.component.html',
    styleUrls: ['./image-popup.component.scss'],
})
export class ImagePopupComponent implements OnInit {
    cardTitle: string;
    difficulty: string;
    differenceCount: number;
    validDifferenceCount: boolean;
    cardCreationInfo: CardCreationInfo;

    message: string;
    imagePath: string;
    buttonDisabled: boolean;
    goodCharacters: RegExp = /[a-zA-Z0-9]/;

    // Simply because we have choose to use this component as a popup
    // eslint-disable-next-line max-params
    constructor(
        private readonly cardsService: CardsService,
        private matDialogRef: MatDialogRef<ImagePopupComponent>,
        private router: Router,
        @Inject(MAT_DIALOG_DATA) public data: CardCreationInfo,
    ) {
        this.cardCreationInfo = data;
    }

    ngOnInit() {
        this.showDifferences();
    }

    clearWarningMessage() {
        this.message = '';
    }

    async showDifferences() {
        this.difficulty = this.cardCreationInfo.difficulty;
        this.differenceCount = this.cardCreationInfo.diffCount;
        if (this.difficulty !== 'Invalide') {
            this.validDifferenceCount = true;
        }
        this.imagePath = this.cardCreationInfo.diffImageUrl;
    }

    async saveCard() {
        this.buttonDisabled = true;
        if (this.cardTitle && this.goodCharacters.test(this.cardTitle)) {
            this.cardCreationInfo.cardTitle = this.cardTitle;
            if (await this.cardsService.saveCard(this.cardCreationInfo)) {
                this.matDialogRef.close();
                this.router.navigate(['/config']);
                return;
            }
        } else {
            this.message = 'Vous devez entrer un nom de partie valide.';
        }
        this.buttonDisabled = false;
    }

    exitPopup(): void {
        this.matDialogRef.close(this.cardTitle);
    }

    disableDefaultFocus(event: KeyboardEvent): void {
        event.preventDefault();
    }
}
