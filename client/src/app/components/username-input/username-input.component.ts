import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-username-input',
    templateUrl: './username-input.component.html',
    styleUrls: ['./username-input.component.scss'],
})
export class UsernameInputComponent {
    @ViewChild('nameInput') input: ElementRef<HTMLInputElement>;

    message = '';

    constructor(private dialogRef: MatDialogRef<UsernameInputComponent>) {}

    @HostListener('window:keypress', ['$event']) handleEnterEvent(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.validate();
        }
    }

    clearWarningMessage() {
        this.message = '';
    }

    validate(): void {
        if (/[a-zA-Z0-9]/.test(this.input.nativeElement.value)) {
            this.dialogRef.close(this.input.nativeElement.value);
        } else if (this.input.nativeElement.value.length === 0) {
            this.input.nativeElement.focus();
            this.message = "Vous devez entrer un nom d'utilisateur.";
        } else {
            this.input.nativeElement.focus();
            this.message = "Le nom d'utilisateur est invalide.";
        }
    }
}
