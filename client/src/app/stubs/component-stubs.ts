/* istanbul ignore file */
/* eslint-disable no-unused-vars */
/* eslint-disable @angular-eslint/component-selector */
/* eslint-disable max-classes-per-file */
/* eslint-disable @angular-eslint/component-class-suffix */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfirmationComponent } from '@app/components/confirmation/confirmation.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { UsernameInputComponent } from '@app/components/username-input/username-input.component';
import { CardInfo } from '@common/interfaces/card-info';
import { Vec2 } from '@common/interfaces/vec2';
import { SocketClientServiceStub } from './service-stubs';

@Component({
    selector: 'app-game-form',
    template: '<p></p>',
})
export class AppGameFormComponentStub {
    @Input() cardInfo: CardInfo | undefined;
}

@Component({
    selector: 'app-replay',
    template: '<p></p>',
})
export class AppReplayComponentStub {
    @Input() isReplaying: boolean;
    @Input() replayMultiplier: number;
    @Output() setFlashService = new EventEmitter<void>();
    @Output() replayMultiplierChange = new EventEmitter<number>();
    @Output() isReplayingChange = new EventEmitter<boolean>();
    @Output() isShortcutableChange: EventEmitter<boolean> = new EventEmitter<boolean>();
}

@Component({
    selector: 'mat-card-actions',
    template: '<p></p>',
})
export class MatCardActionComponentStub {}

@Component({
    selector: 'mat-card',
    template: '<p></p>',
})
export class MatCardComponentStub {}

@Component({
    selector: 'mat-card-header',
    template: '<p></p>',
})
export class MatCardHeaderComponentStub {}

@Component({
    selector: 'mat-paginator',
    template: '<p></p>',
})
export class MatPaginatorComponentStub {
    @Input() pageSize: number;
    @Input() hidePageSize: boolean;
    @Input() pageSizeOptions: number[];
}

@Component({
    selector: 'button',
    template: '<p></p>',
})
export class MatButtonComponentStub {
    @Input() routerLink: string;
    @Input() queryParams: string;
}

@Component({
    selector: 'app-play-area',
    template: '<p></p>',
})
export class PlayAreaComponentStub {
    @Input() dataURL!: string;
    @Input() socketService!: SocketClientServiceStub;

    @Input() side!: string;
    @Input() canSendClick: boolean = true;
    @Input() thirdHintDisplayed: boolean = false;
    @Input() replayMultiplier: number = 1;

    getCanvasContext(): CanvasRenderingContext2D | null {
        return {} as CanvasRenderingContext2D | null;
    }
    drawImageOnCanvas(_: string): void {
        return;
    }
    displayErrorMessage(_: Vec2) {
        return;
    }
    drawImageDataOnCanvas(_: ImageData): void {
        return;
    }
    getImageDataFromCanvas(_: ImageData): void {
        return;
    }
    displayFirstHint(number: number, diffs: Vec2): void {
        return;
    }
    displaySecondHint(number: number, diffs: Vec2): void {
        return;
    }
    displayThirdHint(number: number, diffs: Vec2): void {
        return;
    }
    clearHint(position: Vec2): void {
        return;
    }
}

@Component({
    selector: 'mat-form-field',
    template: '<p></p>',
})
export class MatFormFieldComponentStub {}

@Component({
    selector: 'mat-label',
    template: '<p></p>',
})
export class MatLabelComponentStub {}

@Component({
    selector: 'mat-select',
    template: '<p></p>',
})
export class MatSelectComponentStub {
    @Input() value: string;
    @Input() ngModel: string;
}

@Component({
    selector: 'mat-sidenav-content',
    template: '<p></p>',
})
export class MatSidenavContentComponentStub {}

@Component({
    selector: 'mat-card-content',
    template: '<p></p>',
})
export class MatCardContentComponentStub {}

@Component({
    selector: 'mat-card-title',
    template: '<p></p>',
})
export class MatCardTitleComponentStub {}

@Component({
    selector: 'mat-sidenav',
    template: '<p></p>',
})
export class MatSideNavComponentStub {}

@Component({
    selector: 'mat-sidenav-container',
    template: '<p></p>',
})
export class MatSideNavContainerComponentStub {}

@Component({
    selector: 'mat-option',
    template: '<p></p>',
})
export class MatOptionComponentStub {
    @Input() value: string;
}

@Component({
    selector: 'mat-nav-list',
    template: '<p></p>',
})
export class MatNavListComponentStub {}

@Component({
    selector: 'mat-button-toggle-group',
    template: '<p></p>',
})
export class MatButtonToggleGroupStub {}

@Component({
    selector: 'mat-toolbar',
    template: '<p></p>',
})
export class MatToolbarStub {}

@Component({
    selector: 'mat-button-toggle',
    template: '<p></p>',
})
export class MatButtonToggleStub {}

@Component({
    selector: 'app-radius-selection-menu',
    template: '<p></p>',
})
export class AppRadiusSelectionMenuComponentStub {}

@Component({
    selector: 'app-difference-area',
    template: '<p></p>',
})
export class AppDifferenceAreaComponentStub {
    @Input() selectedCommand: string;
    @Input() thicknessPicked: number;
    @Input() colorPicked: string;

    resetCanvas(): void {
        return;
    }

    duplicateCanvas(): void {
        return;
    }

    swapCanvases(): void {
        return;
    }
}

@Component({
    selector: 'input',
    template: '<p></p>',
})
export class InputComponentStub {
    @Input() ngModel: string;
}

@Component({
    selector: 'app-username-input',
    template: '<input #nameInput type="text"/>',
})
export class UsernameInputComponentStub extends UsernameInputComponent {
    override validate(): void {
        return;
    }
}

@Component({
    selector: 'app-popup-message',
    template: '<p></p>',
})
export class PopupMessageComponentStub extends PopupMessageComponent {
    override close() {
        return;
    }
}

@Component({
    selector: 'app-confirmation',
    template: '<p></p>',
})
export class ConfirmationComponentStub extends ConfirmationComponent {
    override onClick(_: boolean): void {
        return;
    }
}

export const COMPONENT_STUBS = [
    AppGameFormComponentStub,
    MatCardActionComponentStub,
    MatCardComponentStub,
    MatCardHeaderComponentStub,
    MatPaginatorComponentStub,
    MatButtonComponentStub,
    MatFormFieldComponentStub,
    MatLabelComponentStub,
    MatSelectComponentStub,
    MatSidenavContentComponentStub,
    MatCardContentComponentStub,
    MatCardTitleComponentStub,
    MatSideNavComponentStub,
    MatSideNavContainerComponentStub,
    MatOptionComponentStub,
    MatNavListComponentStub,
    MatButtonToggleGroupStub,
    MatButtonToggleStub,
    MatToolbarStub,
    AppRadiusSelectionMenuComponentStub,
    AppDifferenceAreaComponentStub,
    InputComponentStub,
    PlayAreaComponentStub,
    UsernameInputComponentStub,
    PopupMessageComponentStub,
    ConfirmationComponentStub,
    AppReplayComponentStub,
];
