import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';

export class ResetCanvasCommand {
    private context: CanvasRenderingContext2D;

    setCanvas(canvas: HTMLCanvasElement): void {
        this.context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    execute(): void {
        this.clearCanvas();
    }

    clearCanvas(): void {
        this.context.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }
}
