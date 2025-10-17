import { Injectable } from '@angular/core';
import { OPACITY_POS, PIXEL_LENGTH } from '@app/constants/bmp';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';

import { Vec2 } from '@common/interfaces/vec2';

@Injectable({
    providedIn: 'root',
})
export class CanvasModificationService {
    context: CanvasRenderingContext2D;

    setCanvas(canvas: HTMLCanvasElement) {
        this.context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    drawImageOnCanvas(image: HTMLImageElement) {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.context.drawImage(image, 0, 0);
    }

    drawImageDataOnCanvas(image: ImageData) {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.context.putImageData(image, 0, 0);
    }

    getImageDataFromCanvas(): ImageData {
        return this.context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    resetCanvas() {
        this.context.fillStyle = 'white';
        this.context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    restorePixels(coordinates: Vec2[], leftImage: ImageData, rightImage: ImageData): ImageData {
        let index: number;
        for (const coord of coordinates) {
            index = this.getIndexFromPosition(coord);
            for (let i = index; i < index + PIXEL_LENGTH - 1; i++) {
                rightImage.data[i] = leftImage.data[i];
            }
        }
        return rightImage;
    }

    changePixelsOpacity(coordinates: Vec2[], image: ImageData, opacity: number): ImageData {
        let index: number;
        for (const coord of coordinates) {
            index = this.getIndexFromPosition(coord);
            image.data[index + OPACITY_POS] = opacity;
        }
        return image;
    }

    private getIndexFromPosition(coord: Vec2): number {
        return coord.y * (IMAGE_WIDTH * PIXEL_LENGTH) + coord.x * PIXEL_LENGTH;
    }
}
