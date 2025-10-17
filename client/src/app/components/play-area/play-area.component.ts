import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { CanvasModificationService } from '@app/services/creating/canvas-modification.service';
import { MouseService } from '@app/services/playing/mouse.service';
import { ONE_SECOND_IN_MS } from '@common/constants/time';
import { Vec2 } from '@common/interfaces/vec2';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
    providers: [CanvasModificationService],
})
export class PlayAreaComponent implements AfterViewInit {
    @Input() dataURL!: string;
    @Input() socketService!: SocketClientService;

    @Input() side!: string;
    @Input() canSendClick: boolean = true;
    @Input() replayMultiplier: number = 1;

    @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('errorMessage') errorMessage!: ElementRef<HTMLImageElement>;

    coords: Vec2;
    class: string;

    // This copy of the image is used as a backup in case we want to modify the image
    // for a short period of time and then restore it to its original state
    originalImage: ImageData;

    constructor(private readonly mouseService: MouseService, private readonly canvasModificationService: CanvasModificationService) {}

    ngAfterViewInit(): void {
        this.canvasModificationService.setCanvas(this.canvas.nativeElement);
    }

    drawImageDataOnCanvas(image: ImageData): void {
        this.canvasModificationService.drawImageDataOnCanvas(image);
    }

    getImageDataFromCanvas(): ImageData {
        return this.canvasModificationService.getImageDataFromCanvas();
    }

    mouseHitDetect(event: MouseEvent): void {
        if (this.canSendClick) {
            this.mouseService.mouseHitDetect(event, this.socketService, this.side);
        }
    }

    getCanvasContext(): CanvasRenderingContext2D | null {
        return this.canvas.nativeElement.getContext('2d', { willReadFrequently: true });
    }

    displayErrorMessage(position: Vec2) {
        const topShift = -21;
        const leftShift = -68;
        this.errorMessage.nativeElement.style.display = '';
        this.errorMessage.nativeElement.style.position = 'absolute';
        this.errorMessage.nativeElement.style.top = position.y + topShift + 'px';
        this.errorMessage.nativeElement.style.left = position.x + leftShift + 'px';
        setTimeout(() => {
            this.errorMessage.nativeElement.style.display = 'none';
        }, ONE_SECOND_IN_MS / this.replayMultiplier);
    }

    getFrontCanvasContext(canvas: ElementRef<HTMLCanvasElement>): CanvasRenderingContext2D | null {
        return canvas.nativeElement.getContext('2d', { willReadFrequently: true });
    }
}
