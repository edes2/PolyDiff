import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';

export class SwapCanvasesCommand {
    private firstImageData: ImageData;
    private secondImageData: ImageData;
    private firstContext: CanvasRenderingContext2D;
    private secondContext: CanvasRenderingContext2D;

    setCanvas(firstCanvas: HTMLCanvasElement, secondCanvas: HTMLCanvasElement): void {
        this.firstContext = firstCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.secondContext = secondCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.firstImageData = this.firstContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.secondImageData = this.secondContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    execute(): void {
        this.firstContext.putImageData(this.secondImageData, 0, 0);
        this.secondContext.putImageData(this.firstImageData, 0, 0);
    }

    clearCanvas(): void {
        this.firstContext.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.secondContext.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }
}
