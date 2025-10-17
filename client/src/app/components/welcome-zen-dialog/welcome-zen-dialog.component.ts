import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MusicType } from '@common/interfaces/music';
const REALLY_DEEP_QUOTE =
    'Fermez les yeux, respirez profondément, et imaginez un lieu de paix. Maintenant, ouvrez les yeux, vous êtes toujours devant votre écran.';
const REALLY_DEEP_QUOTE_AUTHOR = 'Confucius';

@Component({
    selector: 'app-welcome-zen-dialog',
    templateUrl: './welcome-zen-dialog.component.html',
    styleUrls: ['./welcome-zen-dialog.component.scss'],
})
export class WelcomeZenDialogComponent {
    musicType: string | null = null;
    reallyDeepQuote: string = REALLY_DEEP_QUOTE;
    reallyDeepQuoteAuthor: string = REALLY_DEEP_QUOTE_AUTHOR;
    musicTypes = MusicType;

    constructor(public dialogRef: MatDialogRef<WelcomeZenDialogComponent>) {}

    closeDialog() {
        this.dialogRef.close(this.musicType);
    }

    selectMusicType(type: string): void {
        this.musicType = type;
    }
}
