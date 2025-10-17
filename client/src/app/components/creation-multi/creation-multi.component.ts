import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GameMode } from '@common/enums/mode';

export interface DialogMultiData {
    duration: number;
    cheatingMode: boolean;
    limitedBonus?: number;
}

@Component({
    selector: 'app-creation-multi',
    templateUrl: './creation-multi.component.html',
    styleUrls: ['./creation-multi.component.scss'],
})
export class CreationMultiComponent {
    mode: GameMode;
    valid: boolean = true;
    choice: DialogMultiData = {
        duration: 60,
        cheatingMode: false,
        limitedBonus: 5,
    };
    limitedChoice: DialogMultiData;
    isCheating: boolean = false;
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { message: string; routerLink: string },
        public dialogRef: MatDialogRef<CreationMultiComponent>,
    ) {}

    saveConfiguration(): void {
        switch (this.mode) {
            case GameMode.Classic:
                this.dialogRef.close({
                    duration: this.choice.duration,
                    cheatingMode: this.choice.cheatingMode,
                });
                break;
            case GameMode.LimitedTime:
                this.dialogRef.close({
                    duration: this.choice.duration,
                    cheatingMode: this.choice.cheatingMode,
                    limitedBonus: this.choice.limitedBonus,
                });
                break;
        }
        this.dialogRef.close(this.choice);
    }
    changeChoiceCheating(cheatingChoice: boolean): void {
        this.choice.cheatingMode = cheatingChoice;
        this.isCheating = cheatingChoice;
    }
    cancelCreation(): void {
        this.dialogRef.close();
    }
}
