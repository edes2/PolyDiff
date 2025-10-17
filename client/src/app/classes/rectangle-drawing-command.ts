import { BaseDrawingCommand } from '@app/classes/base-drawing-command';
import { Vec2 } from '@common/interfaces/vec2';

export class RectangleDrawingCommand extends BaseDrawingCommand {
    private startingPoint: Vec2;
    private rectangleDimensions: Vec2;

    setStartingPoint(point: Vec2): void {
        this.startingPoint = point;
    }

    setRectangleDimensions(dimensions: Vec2): void {
        this.rectangleDimensions = dimensions;
    }

    execute(): void {
        this.context.fillStyle = this.colorPicked;
        this.context.globalCompositeOperation = 'source-over';
        this.context.fillRect(this.startingPoint.x, this.startingPoint.y, this.rectangleDimensions.x, this.rectangleDimensions.y);
    }
}
