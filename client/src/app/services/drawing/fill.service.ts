import { Injectable } from '@angular/core';
import { FillDrawingCommand } from '@app/classes/fill-drawing.component';
import { Vec2 } from '@common/interfaces/vec2';
import { BaseDrawingService } from './base-drawing.service';
import { DrawingCommandManagerService } from './drawing-command-manager.service';

@Injectable({
    providedIn: 'root',
})
export class FillService extends BaseDrawingService {
    private fillDrawingCommand: FillDrawingCommand;
    private canvasStartingPoint: Vec2;
    constructor(private readonly drawingCommandManagerService: DrawingCommandManagerService) {
        super();
    }

    override onMouseDown(event: MouseEvent, colorPicked: string): void {
        this.hasRegisteredCommand = false;
        if (this.isLeftClick(event)) {
            this.setStartingPointOnCanvas(event, colorPicked);
            this.fillArea();
        }
    }

    override onMouseUp(event: MouseEvent): void {
        if (this.isLeftClick(event)) {
            this.fillArea();
            this.drawingCommandManagerService.registerCommand(this.fillDrawingCommand);
            this.hasRegisteredCommand = true;
        }
    }

    fillArea(): void {
        this.mouseIsDown = false;
        const frontCanvas: HTMLCanvasElement = this.frontCanvases.get(this.side) as HTMLCanvasElement;
        this.fillDrawingCommand.setCanvas(frontCanvas);
        this.fillDrawingCommand.execute();
    }

    private setStartingPointOnCanvas(event: MouseEvent, colorPicked: string): void {
        this.mouseIsDown = true;
        const frontCanvas: HTMLCanvasElement = this.frontCanvases.get(this.side) as HTMLCanvasElement;
        this.fillDrawingCommand = new FillDrawingCommand(frontCanvas, colorPicked);
        this.setStartingPoint(event);
    }

    private setStartingPoint(event: MouseEvent): void {
        this.canvasStartingPoint = this.extractCurrentPoint(event);
        this.fillDrawingCommand.setStartingPoint(this.canvasStartingPoint);
    }
}
