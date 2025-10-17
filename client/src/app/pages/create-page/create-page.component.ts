import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfirmationComponent } from '@app/components/confirmation/confirmation.component';
import { DifferenceAreaComponent } from '@app/components/difference-area/difference-area.component';
import { ImagePopupComponent } from '@app/components/image-popup/image-popup.component';
import { BRUSHES_THICKNESS } from '@app/constants/drawing';
import { THEME_COLOR } from '@app/constants/theme';
import { CanvasService } from '@app/services/creating/canvas.service';
import { ImageVerificationService } from '@app/services/creating/image-verification.service';
import { DrawingCommandManagerService } from '@app/services/drawing/drawing-command-manager.service';
import { CardCreationInfo } from '@common/interfaces/card-info';
import { DifferenceImage } from '@common/interfaces/image';

@Component({
    selector: 'app-create-page',
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent {
    @ViewChild('colorPicker') private colorPicker!: ElementRef<HTMLInputElement>;
    @ViewChild('differenceArea') private differenceAreaComponent!: DifferenceAreaComponent;
    isValid: boolean = true;
    hasModifiedCanvas: boolean = false;
    selectedCommand: string;
    undoButtonIsDisabled: boolean = true;
    redoButtonIsDisabled: boolean = true;
    colorPicked: string = THEME_COLOR;
    thicknessPicked: number = 1;
    brushesThickness: number[] = BRUSHES_THICKNESS;
    confirmationPopup: MatDialogRef<ConfirmationComponent>;

    private selectedRadius: number;

    // Because we want to use a single instance of angular classes
    // eslint-disable-next-line max-params
    constructor(
        private matDialog: MatDialog,
        public canvasService: CanvasService,
        private readonly imageVerificationService: ImageVerificationService,
        private readonly drawingCommandManager: DrawingCommandManagerService,
        private router: Router,
    ) {}

    setSelectedCommandType(commandType: string): void {
        this.selectedCommand = commandType;
    }

    setRadius(radius: number) {
        this.selectedRadius = radius;
    }

    openPopup(cardCreation: CardCreationInfo): void {
        this.matDialog.open(ImagePopupComponent, { data: cardCreation });
    }

    async createCard() {
        this.isValid = false;
        const diffImage: DifferenceImage = await this.canvasService.sendCanvas(this.selectedRadius);
        const imagesDataUrl = this.canvasService.getDataUrl();
        const cardInfo: CardCreationInfo = {
            difficulty: diffImage.difficulty,
            diffCount: diffImage.diffCount,
            leftImageUrl: imagesDataUrl.leftImageUrl,
            rightImageUrl: imagesDataUrl.rightImageUrl,
            diffImageUrl: diffImage.uri,
        };
        this.openPopup(cardInfo);
        this.isValid = true;
    }

    async loadImage(event: Event) {
        const element: HTMLInputElement = event.target as HTMLInputElement;
        if (element.files) {
            const file = element.files[0];
            if (await this.imageVerificationService.isValidFile(file)) {
                this.hasModifiedCanvas = true;
                await this.canvasService.addToBoth(await this.imageVerificationService.convertFileToImage(element.files[0]));
            }
        }
        element.value = '';
    }

    resetCanvas(side: string): void {
        this.differenceAreaComponent.resetCanvas(side);
        this.clearRedoStack();
    }

    resetBothBackgrounds(): void {
        this.canvasService.resetBothBackgrounds();
    }

    duplicateCanvas(sideToDuplicateFrom: string, sideToDuplicateOnto: string): void {
        this.differenceAreaComponent.duplicateCanvas(sideToDuplicateFrom, sideToDuplicateOnto);
        this.clearRedoStack();
    }

    swapCanvases(): void {
        this.differenceAreaComponent.swapCanvases();
        this.clearRedoStack();
    }

    catchNewDrawingEvent(newDrawingCommand: boolean): void {
        if (newDrawingCommand) {
            this.hasModifiedCanvas = true;
            this.undoButtonIsDisabled = false;
            this.clearRedoStack();
        }
    }

    clearRedoStack(): void {
        this.drawingCommandManager.clearRedoStack();
        this.redoButtonIsDisabled = true;
    }

    undoDrawingCommand(): void {
        this.drawingCommandManager.undo();
        this.checkStacksLengths();
    }

    redoDrawingCommand(): void {
        this.drawingCommandManager.redo();
        this.checkStacksLengths();
    }

    checkStacksLengths(): void {
        this.undoButtonIsDisabled = this.drawingCommandManager.undoStackIsEmpty();
        this.redoButtonIsDisabled = this.drawingCommandManager.redoStackIsEmpty();
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === 'Z' && event.shiftKey && !this.redoButtonIsDisabled) {
            this.redoDrawingCommand();
        } else if (event.ctrlKey && event.key === 'z' && !this.undoButtonIsDisabled) {
            this.undoDrawingCommand();
        }
    }

    captureEvent(): void {
        this.colorPicker.nativeElement.click();
    }

    openWarningPopup(): void {
        this.router.navigate(['/config']);
        // if (this.hasModifiedCanvas || this.differenceAreaComponent.hasModifiedCanvas) {
        //     this.confirmationPopup = this.matDialog.open(ConfirmationComponent, {
        //         data: {
        //             message: 'Êtes-vous certain de vouloir quitter ? Aucune modification apportée ne sera sauvegardée.',
        //         },
        //     });
        //     this.confirmationPopup.afterClosed().subscribe((choice: boolean) => {
        //         if (choice) {
        //             this.router.navigate(['/config']);
        //         }
        //     });
        // } else {
        // }
    }
}
