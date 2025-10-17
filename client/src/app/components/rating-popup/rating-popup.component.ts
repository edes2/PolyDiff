import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-rating-popup',
    templateUrl: './rating-popup.component.html',
    styleUrls: ['./rating-popup.component.scss'],
})
export class RatingPopupComponent {
    rating: number = 0;
    ratingHasChanged: boolean = false;

    routerLink: string;

    constructor(public dialogRef: MatDialogRef<RatingPopupComponent>) {}

    setRating(newRating: number) {
        this.ratingHasChanged = true;
        this.rating = newRating;
    }

    submitRating() {
        this.dialogRef.close(this.rating);
    }
}
