import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmation',
    templateUrl: './confirmation.component.html',
    styleUrls: ['./confirmation.component.scss'],
})
export class ConfirmationComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { message: string },
        public dialogRef: MatDialogRef<ConfirmationComponent>, // private router: Router,
    ) {}

    onClick(choice: boolean): void {
        this.dialogRef.close(choice);
    }
}
