import { BaseDrawingCommand } from '@app/classes/base-drawing-command';
import { Vec2 } from '@common/interfaces/vec2';

export class EllipseDrawingCommand extends BaseDrawingCommand {
    private startingPoint: Vec2;
    private ellipseDimensions: Vec2;

    setStartingPoint(point: Vec2): void {
        this.startingPoint = point;
    }

    setEllipseDimensions(dimensions: Vec2): void {
        this.ellipseDimensions = dimensions;
    }

    execute(): void {
        this.context.fillStyle = this.colorPicked;
        this.context.globalCompositeOperation = 'source-over';

        const centerX = this.startingPoint.x + this.ellipseDimensions.x / 2;
        const centerY = this.startingPoint.y + this.ellipseDimensions.y / 2;

        this.context.beginPath();
        this.context.ellipse(centerX, centerY, Math.abs(this.ellipseDimensions.x) / 2, Math.abs(this.ellipseDimensions.y) / 2, 0, 0, Math.PI * 2);
        this.context.fill();
    }
}
