import { Injectable } from '@angular/core';
import { RectangleDrawingCommand } from '@app/classes/rectangle-drawing-command';
import { BaseDrawingService } from '@app/services/drawing/base-drawing.service';
import { DrawingCommandManagerService } from '@app/services/drawing/drawing-command-manager.service';
import { Vec2 } from '@common/interfaces/vec2';

@Injectable({
    providedIn: 'root',
})
export class RectangleDrawingService extends BaseDrawingService {
    side: string;
    private rectangleDrawingCommand: RectangleDrawingCommand;
    private canvasStartingPoint: Vec2;
    private canvasEndingPoint: Vec2;
    private displayCanvases: Map<string, HTMLCanvasElement>;

    constructor(private readonly drawingCommandManagerService: DrawingCommandManagerService) {
        super();
    }

    override onMouseDown(event: MouseEvent, colorPicked: string): void {
        this.hasRegisteredCommand = false;
        if (this.isLeftClick(event)) {
            this.setStartingPointOnCanvas(event, colorPicked);
        }
    }

    override onMouseMove(event: MouseEvent): void {
        this.dragRectangle(event);
    }

    override onMouseUp(event: MouseEvent): void {
        this.canvasEndingPoint = this.extractCurrentPoint(event);
        if (this.isLeftClick(event) && this.hasMoved()) {
            this.rectangleDrawingCommand.clearCanvas();
            this.drawPermanentRectangle(event);
            this.drawingCommandManagerService.registerCommand(this.rectangleDrawingCommand);
            this.hasRegisteredCommand = true;
        }
    }

    override onKeyToggle(event: KeyboardEvent): void {
        this.dragRectangle(event);
    }

    override setDisplayCanvases(displayCanvases: Map<string, HTMLCanvasElement>) {
        this.displayCanvases = displayCanvases;
    }

    private setStartingPointOnCanvas(event: MouseEvent, colorPicked: string): void {
        this.mouseIsDown = true;
        const displayCanvas: HTMLCanvasElement = this.displayCanvases.get(this.side) as HTMLCanvasElement;
        this.rectangleDrawingCommand = new RectangleDrawingCommand(displayCanvas, colorPicked);
        this.setStartingPoint(event);
    }

    private displayRectangle(event: MouseEvent): void {
        this.rectangleDrawingCommand.clearCanvas();
        this.drawRectangle(event);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private dragRectangle(event: any): void {
        if (this.mouseIsDown === true) {
            this.displayRectangle(event);
        }
    }

    private drawPermanentRectangle(event: MouseEvent): void {
        this.mouseIsDown = false;
        const frontCanvas: HTMLCanvasElement = this.frontCanvases.get(this.side) as HTMLCanvasElement;
        this.rectangleDrawingCommand.setCanvas(frontCanvas);
        this.drawRectangle(event);
    }

    // any is used here in order to be able to test the function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private drawRectangle(event: any): void {
        this.setEndingPoint(event);
        const rectangleDimensions: Vec2 = this.calculateXYDistances(this.canvasStartingPoint, this.canvasEndingPoint);
        if (event.shiftKey === true) {
            this.setSquareDimensions(rectangleDimensions);
        } else {
            this.rectangleDrawingCommand.setRectangleDimensions(rectangleDimensions);
        }
        this.rectangleDrawingCommand.execute();
    }

    private calculateXYDistances(startingPoint: Vec2, endingPoint: Vec2): Vec2 {
        return { x: endingPoint.x - startingPoint.x, y: endingPoint.y - startingPoint.y };
    }

    private setSquareDimensions(dimensions: Vec2): void {
        if ((dimensions.x > 0 && dimensions.y > 0) || (dimensions.x < 0 && dimensions.y < 0)) {
            this.rectangleDrawingCommand.setRectangleDimensions({ x: dimensions.y, y: dimensions.y });
        } else {
            this.rectangleDrawingCommand.setRectangleDimensions({ x: dimensions.x, y: -dimensions.x });
        }
    }

    private setStartingPoint(event: MouseEvent): void {
        this.canvasStartingPoint = this.extractCurrentPoint(event);
        this.rectangleDrawingCommand.setStartingPoint(this.canvasStartingPoint);
    }

    private setEndingPoint(event: MouseEvent): void {
        if (this.isLeftClick(event)) {
            this.canvasEndingPoint = this.extractCurrentPoint(event);
        }
    }

    private hasMoved(): boolean {
        return this.canvasEndingPoint.x !== this.canvasStartingPoint.x || this.canvasEndingPoint.y !== this.canvasStartingPoint.y;
    }
}
