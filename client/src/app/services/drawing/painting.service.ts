import { Injectable } from '@angular/core';
import { LineDrawingCommand } from '@app/classes/line-drawing-command';
import { Vec2 } from '@common/interfaces/vec2';
import { BaseDrawingService } from './base-drawing.service';
import { DrawingCommandManagerService } from './drawing-command-manager.service';

@Injectable({
    providedIn: 'root',
})
export class PaintingService extends BaseDrawingService {
    brushStyle: GlobalCompositeOperation = 'source-over';
    lineCap: CanvasLineCap = 'round';
    private lineDrawingCommand: LineDrawingCommand;

    constructor(private readonly drawingCommandManagerService: DrawingCommandManagerService) {
        super();
    }

    override onMouseDown(event: MouseEvent, colorPicked: string, thicknessPicked: number): void {
        this.hasRegisteredCommand = false;
        if (this.isLeftClick(event)) {
            this.setStartingPointOnCanvas(event, colorPicked, thicknessPicked);
        }
    }

    override onMouseMove(event: MouseEvent): void {
        this.dragLine(event);
    }

    override onMouseUp(event: MouseEvent): void {
        if (this.isLeftClick(event)) {
            this.mouseIsDown = false;
            this.lineDrawingCommand.closePath();
            this.drawingCommandManagerService.registerCommand(this.lineDrawingCommand);
            this.hasRegisteredCommand = true;
        }
    }

    private dragLine(event: MouseEvent): void {
        if (this.mouseIsDown === true) {
            const currentPoint = this.extractCurrentPoint(event);
            this.drawPoint(currentPoint);
        }
    }

    private setStartingPointOnCanvas(event: MouseEvent, colorPicked: string, thicknessPicked: number): void {
        this.mouseIsDown = true;
        const frontCanvas: HTMLCanvasElement = this.frontCanvases.get(this.side) as HTMLCanvasElement;
        this.lineDrawingCommand = new LineDrawingCommand(frontCanvas, colorPicked, thicknessPicked);
        this.lineDrawingCommand.setBrushStyle(this.brushStyle);
        this.lineDrawingCommand.setLineCap(this.lineCap);
        this.lineDrawingCommand.initialize();
        this.lineDrawingCommand.beginPath();
        this.setStartingPoint(event);
    }

    private setStartingPoint(event: MouseEvent): void {
        const currentPoint = this.extractCurrentPoint(event);
        this.lineDrawingCommand.moveTo(currentPoint);
        this.drawPoint(currentPoint);
    }

    private drawPoint(point: Vec2) {
        this.lineDrawingCommand.addPointToPath(point);
        this.lineDrawingCommand.drawPoint(point);
    }
}
