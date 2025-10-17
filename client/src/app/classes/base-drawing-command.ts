import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';

export class BaseDrawingCommand {
    protected context: CanvasRenderingContext2D;
    protected colorPicked: string;

    constructor(canvas: HTMLCanvasElement, color: string) {
        this.setCanvas(canvas);
        this.colorPicked = color;
    }

    setCanvas(canvas: HTMLCanvasElement): void {
        this.context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    clearCanvas(): void {
        this.context.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    execute(): void {
        return;
    }
}
