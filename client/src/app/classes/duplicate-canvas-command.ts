import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';

export class DuplicateCanvasCommand {
    private contextToDuplicateFrom: CanvasRenderingContext2D;
    private contextToDuplicateOnto: CanvasRenderingContext2D;
    private imageDataToDuplicate: ImageData;

    setCanvas(frontCanvasToDuplicateFrom: HTMLCanvasElement, frontCanvasToDuplicateOnto: HTMLCanvasElement): void {
        this.contextToDuplicateFrom = frontCanvasToDuplicateFrom.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.contextToDuplicateOnto = frontCanvasToDuplicateOnto.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.imageDataToDuplicate = this.contextToDuplicateFrom.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    execute(): void {
        this.clearCanvas();
        this.contextToDuplicateOnto.putImageData(this.imageDataToDuplicate, 0, 0);
    }

    clearCanvas(): void {
        this.contextToDuplicateOnto.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }
}
