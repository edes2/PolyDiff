import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CanvasModificationService } from '@app/services/creating/canvas-modification.service';
import { ClickValidation } from '@common/interfaces/socket-communication';
import { Vec2 } from '@common/interfaces/vec2';

const ANTI_CLICK_SPAM_DELAY = 500;

@Component({
    selector: 'app-play-area-zen',
    templateUrl: './zen-play-area.component.html',
    styleUrls: ['./zen-play-area.component.scss'],
    providers: [CanvasModificationService],
})
export class ZenPlayAreaComponent implements AfterViewInit {
    @Input() dataURL!: string;
    @Input() isLeft!: boolean;

    @Output() mouseClick: EventEmitter<ClickValidation> = new EventEmitter<ClickValidation>();

    @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

    // This copy of the image is used as a backup in case we want to modify the image
    // for a short period of time and then restore it to its original state
    originalImage: ImageData;

    isClickDisabled: boolean = true;

    constructor(private readonly canvasModificationService: CanvasModificationService) {}

    ngAfterViewInit(): void {
        this.canvasModificationService.setCanvas(this.canvas.nativeElement);
    }

    enableClick(): void {
        this.isClickDisabled = false;
    }

    disableClick(): void {
        this.isClickDisabled = true;
    }

    drawImageDataOnCanvas(image: ImageData): void {
        this.canvasModificationService.drawImageDataOnCanvas(image);
    }

    getImageDataFromCanvas(): ImageData {
        return this.canvasModificationService.getImageDataFromCanvas();
    }

    mouseHitDetect(event: MouseEvent): void {
        if (this.isClickDisabled) return;
        this.disableClick();
        const pos: Vec2 = { x: event.offsetX, y: event.offsetY };
        this.mouseClick.emit({ position: pos, side: this.isLeft ? 'left' : 'right' });
        setTimeout(() => this.enableClick(), ANTI_CLICK_SPAM_DELAY);
    }

    getCanvasContext(): CanvasRenderingContext2D | null {
        return this.canvas.nativeElement.getContext('2d', { willReadFrequently: true });
    }

    // Only used to match the interface of PlayAreaComponent
    // eslint-disable-next-line no-unused-vars
    displayErrorMessage(_: Vec2) {
        return;
    }

    getFrontCanvasContext(canvas: ElementRef<HTMLCanvasElement>): CanvasRenderingContext2D | null {
        return canvas.nativeElement.getContext('2d', { willReadFrequently: true });
    }
}
