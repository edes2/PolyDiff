import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PopupMessage } from '@common/interfaces/socket-communication';

@Component({
    selector: 'app-popup-message',
    templateUrl: './popup-message.component.html',
    styleUrls: ['./popup-message.component.scss'],
})
export class PopupMessageComponent {
    routerLink: string;

    constructor(
        public dialogRef: MatDialogRef<PopupMessageComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { message: PopupMessage },
        private router: Router,
    ) {}

    close(route: string | undefined, button: number) {
        this.dialogRef.close(button);
        if (route) {
            this.router.navigate([route]);
        }
    }
}
