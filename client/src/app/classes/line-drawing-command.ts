import { Vec2 } from '@common/interfaces/vec2';
import { BaseDrawingCommand } from './base-drawing-command';

export class LineDrawingCommand extends BaseDrawingCommand {
    private thickness: number;
    private path: Vec2[] = [];
    private brushStyle: GlobalCompositeOperation = 'source-over';
    private lineCap: CanvasLineCap;

    constructor(canvas: HTMLCanvasElement, color: string, thickness: number) {
        super(canvas, color);
        this.thickness = thickness;
    }

    initialize(): void {
        this.context.globalCompositeOperation = this.brushStyle;
        this.context.lineCap = this.lineCap;
        this.context.lineJoin = 'round';
        this.context.lineWidth = this.thickness;
        this.context.strokeStyle = this.colorPicked;
    }

    moveTo(point: Vec2): void {
        this.context.moveTo(point.x, point.y);
    }

    execute(): void {
        this.initialize();
        this.context.beginPath();
        for (const point of this.path) {
            this.drawPoint(point);
        }
        this.context.closePath();
    }

    drawPoint(point: Vec2) {
        this.context.lineTo(point.x, point.y);
        this.context.stroke();
    }

    addPointToPath(point: Vec2): void {
        this.path.push(point);
    }

    beginPath(): void {
        this.context.beginPath();
    }

    closePath(): void {
        this.context.closePath();
    }

    setBrushStyle(brushStyle: GlobalCompositeOperation): void {
        this.brushStyle = brushStyle;
    }

    setLineCap(lineCap: CanvasLineCap): void {
        this.lineCap = lineCap;
    }
}
