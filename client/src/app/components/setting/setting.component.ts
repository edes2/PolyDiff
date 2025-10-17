// import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
// import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// import { AlertComponent } from '@app/components/alert/alert.component';
// import { CommunicationService } from '@app/services/communication/communication.service';
// import { DEFAULT_SETTING_CONTAINER } from '@common/constants/settings';
// import { Setting, SettingContainer } from '@common/interfaces/settings';
// import { Observable } from 'rxjs/internal/Observable';
// import { of } from 'rxjs/internal/observable/of';

// @Component({
//     selector: 'app-setting',
//     templateUrl: './setting.component.html',
//     styleUrls: ['./setting.component.scss'],
// })
// export class SettingComponent implements OnInit {
//     @ViewChildren('input') private inputs: QueryList<ElementRef<HTMLInputElement>>;

//     settings: Observable<SettingContainer>;
//     validity: boolean[] = [].constructor(3).fill(true, 0, 3);

//     constructor(
//         private matDialog: MatDialog,
//         private matDialogRef: MatDialogRef<SettingComponent>,
//         private readonly communicationService: CommunicationService,
//     ) {}

//     ngOnInit(): void {
//         this.getAllSettings();
//     }

//     exitPopup(): void {
//         this.matDialogRef.close();
//     }

//     getAllSettings(): void {
//         this.communicationService.allSettingsGet().subscribe((response) => {
//             this.settings = of(response);
//         });
//     }

//     modifyAll(isDataReset: boolean): void {
//         const settings = structuredClone(DEFAULT_SETTING_CONTAINER);
//         let index = 0;
//         if (isDataReset) {
//             for (const [, setting] of Object.entries(settings)) {
//                 this.resetSetting(setting as Setting, index);
//                 index++;
//             }
//         } else {
//             for (const [, setting] of Object.entries(settings)) {
//                 this.updateSetting(setting as Setting, index);
//                 index++;
//             }
//         }

//         index = 0;
//         let everythingIsValid = true;
//         for (const [, setting] of Object.entries(settings)) {
//             if (!this.isValidSetting(setting as Setting)) {
//                 everythingIsValid = false;
//                 this.validity[index] = false;
//             } else {
//                 this.validity[index] = true;
//             }
//             index++;
//         }

//         if (everythingIsValid) {
//             this.communicationService.settingsPut(settings).subscribe((response) => {
//                 if (response.ok) {
//                     this.alertModification(isDataReset);
//                 } else {
//                     this.matDialog.open(AlertComponent, { data: { message: 'Une erreur est survenue durant la modification des constantes.' } });
//                 }
//             });
//         }
//     }

//     disableDefaultFocus(event: KeyboardEvent): void {
//         event.preventDefault();
//     }

//     private updateSetting(setting: Setting, index: number) {
//         const input = this.inputs.toArray()[index].nativeElement;
//         setting.value = input.valueAsNumber;
//     }
//     private resetSetting(setting: Setting, index: number) {
//         const input = this.inputs.toArray()[index].nativeElement;
//         input.valueAsNumber = setting.value;
//     }

//     private alertModification(isDataReset: boolean): void {
//         this.matDialogRef.close();
//         if (isDataReset) {
//             this.matDialog.open(AlertComponent, { data: { message: 'Les constantes de jeu ont été réinitialisées aux valeurs par défaut.' } });
//         } else {
//             this.matDialog.open(AlertComponent, { data: { message: 'Les constantes de jeu ont été modifiées avec succès.' } });
//         }
//     }

//     private isValidSetting(setting: Setting): boolean {
//         return setting.value >= setting.minValue && setting.value <= setting.maxValue;
//     }
// }
