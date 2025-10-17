import { Injectable } from '@angular/core';
import { CommunicationService } from '@app/services/communication/communication.service';
import { CanvasModificationService } from '@app/services/creating/canvas-modification.service';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { DifferenceImage } from '@common/interfaces/image';
@Injectable({
    providedIn: 'root',
})
export class CanvasService {
    leftBack: HTMLCanvasElement;
    rightBack: HTMLCanvasElement;
    leftFront: HTMLCanvasElement;
    rightFront: HTMLCanvasElement;

    backContext: CanvasRenderingContext2D;
    frontContext: CanvasRenderingContext2D;

    constructor(private readonly canvasModificationService: CanvasModificationService, private readonly communicationService: CommunicationService) {}

    setupBack(left: HTMLCanvasElement, right: HTMLCanvasElement) {
        this.leftBack = left;
        this.rightBack = right;
    }

    setupFront(left: HTMLCanvasElement, right: HTMLCanvasElement) {
        this.leftFront = left;
        this.rightFront = right;
    }

    add(image: HTMLImageElement, canvas: HTMLCanvasElement) {
        this.resetImage(canvas);
        this.drawImage(image, canvas);
    }

    async addToBoth(image: HTMLImageElement): Promise<void> {
        this.add(image, this.leftBack);
        this.add(image, this.rightBack);
    }

    reset(canvas: HTMLCanvasElement) {
        this.resetImage(canvas);
    }

    resetBothBackgrounds(): void {
        this.reset(this.leftBack);
        this.reset(this.rightBack);
    }

    async sendCanvas(radius: number): Promise<DifferenceImage> {
        return new Promise((resolve) => {
            const canvasUrl = this.getDataUrl();
            this.communicationService
                .bothCanvasPost(canvasUrl.leftImageUrl, canvasUrl.rightImageUrl, radius)
                .subscribe((diffImage: DifferenceImage) => {
                    resolve(diffImage);
                });
        });
    }

    getDataUrl() {
        return {
            leftImageUrl: this.merge(this.leftBack, this.leftFront),
            rightImageUrl: this.merge(this.rightBack, this.rightFront),
        };
    }

    private drawImage(img: HTMLImageElement, canvas: HTMLCanvasElement) {
        this.canvasModificationService.setCanvas(canvas);
        this.canvasModificationService.drawImageOnCanvas(img);
    }

    private resetImage(canvas: HTMLCanvasElement) {
        this.canvasModificationService.setCanvas(canvas);
        this.canvasModificationService.resetCanvas();
    }

    private merge(back: HTMLCanvasElement, front: HTMLCanvasElement): string {
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_WIDTH;
        canvas.height = IMAGE_HEIGHT;
        const context: CanvasRenderingContext2D = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        context.drawImage(back, 0, 0);
        context.drawImage(front, 0, 0);
        return canvas.toDataURL();
    }
}
