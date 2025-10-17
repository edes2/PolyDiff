import { Injectable } from '@angular/core';
import { EllipseDrawingCommand } from '@app/classes/ellipse-drawing.command';
import { BaseDrawingService } from '@app/services/drawing/base-drawing.service';
import { DrawingCommandManagerService } from '@app/services/drawing/drawing-command-manager.service';
import { Vec2 } from '@common/interfaces/vec2';

@Injectable({
    providedIn: 'root',
})
export class EllipseDrawingService extends BaseDrawingService {
    private ellipseDrawingCommand: EllipseDrawingCommand;
    private canvasStartingPoint: Vec2;
    private canvasEndingPoint: Vec2;
    private displayCanvases: Map<string, HTMLCanvasElement>;
    private initialCanvasStartingPoint: Vec2; // Store the initial starting point

    constructor(private readonly drawingCommandManagerService: DrawingCommandManagerService) {
        super();
    }

    override onMouseDown(event: MouseEvent, colorPicked: string): void {
        this.hasRegisteredCommand = false;
        if (this.isLeftClick(event)) {
            this.setStartingPointOnCanvas(event, colorPicked);
            this.initialCanvasStartingPoint = this.canvasStartingPoint; // Store the initial starting point
        }
    }

    override onMouseMove(event: MouseEvent): void {
        this.dragEllipse(event);
    }

    override onMouseUp(event: MouseEvent): void {
        this.canvasEndingPoint = this.extractCurrentPoint(event);
        if (this.isLeftClick(event) && this.hasMoved()) {
            this.ellipseDrawingCommand.clearCanvas();
            this.drawPermanentEllipse(event);
            this.drawingCommandManagerService.registerCommand(this.ellipseDrawingCommand);
            this.hasRegisteredCommand = true;
        }
    }

    override onKeyToggle(event: KeyboardEvent): void {
        this.dragEllipse(event);
    }

    override setDisplayCanvases(displayCanvases: Map<string, HTMLCanvasElement>) {
        this.displayCanvases = displayCanvases;
    }

    private setStartingPointOnCanvas(event: MouseEvent, colorPicked: string): void {
        this.mouseIsDown = true;
        const displayCanvas: HTMLCanvasElement = this.displayCanvases.get(this.side) as HTMLCanvasElement;
        this.ellipseDrawingCommand = new EllipseDrawingCommand(displayCanvas, colorPicked);
        this.setStartingPoint(event);
    }

    private displayEllipse(event: MouseEvent): void {
        this.ellipseDrawingCommand.clearCanvas();
        this.drawEllipse(event);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private dragEllipse(event: any): void {
        if (this.mouseIsDown === true) {
            this.displayEllipse(event);
        }
    }

    private drawPermanentEllipse(event: MouseEvent): void {
        this.mouseIsDown = false;
        const frontCanvas: HTMLCanvasElement = this.frontCanvases.get(this.side) as HTMLCanvasElement;
        this.ellipseDrawingCommand.setCanvas(frontCanvas);
        this.drawEllipse(event);
    }

    private drawEllipse(event: MouseEvent): void {
        this.setEndingPoint(event);

        if (event.shiftKey === true) {
            // Calculate the radius based on the maximum distance from the initial starting point
            const dx = Math.abs(this.canvasEndingPoint.x - this.initialCanvasStartingPoint.x);
            const dy = Math.abs(this.canvasEndingPoint.y - this.initialCanvasStartingPoint.y);
            const radius = Math.max(dx, dy) / 2;

            const centerX = this.initialCanvasStartingPoint.x + (this.canvasEndingPoint.x > this.initialCanvasStartingPoint.x ? radius : -radius);
            const centerY = this.initialCanvasStartingPoint.y + (this.canvasEndingPoint.y > this.initialCanvasStartingPoint.y ? radius : -radius);

            this.ellipseDrawingCommand.setEllipseDimensions({ x: radius * 2, y: radius * 2 });
            this.ellipseDrawingCommand.setStartingPoint({ x: centerX, y: centerY });
        } else {
            this.ellipseDrawingCommand.setEllipseDimensions(this.calculateXYDistances(this.initialCanvasStartingPoint, this.canvasEndingPoint));
        }

        this.ellipseDrawingCommand.execute();
    }

    private calculateXYDistances(startingPoint: Vec2, endingPoint: Vec2): Vec2 {
        return { x: endingPoint.x - startingPoint.x, y: endingPoint.y - startingPoint.y };
    }

    private setStartingPoint(event: MouseEvent): void {
        this.canvasStartingPoint = this.extractCurrentPoint(event);
        this.ellipseDrawingCommand.setStartingPoint(this.canvasStartingPoint);
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
