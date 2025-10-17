import { Injectable } from '@angular/core';
import { DuplicateCanvasCommand } from '@app/classes/duplicate-canvas-command';
import { ResetCanvasCommand } from '@app/classes/reset-canvas-command';
import { SwapCanvasesCommand } from '@app/classes/swap-canvases-command';
import { DrawingCommandManagerService } from '@app/services/drawing/drawing-command-manager.service';

@Injectable({
    providedIn: 'root',
})
export class CanvasCommandService {
    constructor(private readonly drawingCommandManagerService: DrawingCommandManagerService) {}

    resetCanvas(frontCanvas: HTMLCanvasElement, displayCanvas: HTMLCanvasElement): void {
        // This condition here prevents from adding reset command to stack if frontCanvas is blank
        if (frontCanvas.toDataURL() !== displayCanvas.toDataURL()) {
            const resetCommand: ResetCanvasCommand = new ResetCanvasCommand();
            resetCommand.setCanvas(frontCanvas);
            this.execute(resetCommand);
        }
    }

    duplicateCanvas(canvasToDuplicateFrom: HTMLCanvasElement, canvasToDuplicateOnto: HTMLCanvasElement): void {
        if (canvasToDuplicateFrom.toDataURL() !== canvasToDuplicateOnto.toDataURL()) {
            const duplicateCommand: DuplicateCanvasCommand = new DuplicateCanvasCommand();
            duplicateCommand.setCanvas(canvasToDuplicateFrom, canvasToDuplicateOnto);
            this.execute(duplicateCommand);
        }
    }

    swapCanvases(firstCanvas: HTMLCanvasElement, secondCanvas: HTMLCanvasElement): void {
        if (firstCanvas.toDataURL() !== secondCanvas.toDataURL()) {
            const swapCommand: SwapCanvasesCommand = new SwapCanvasesCommand();
            swapCommand.setCanvas(firstCanvas, secondCanvas);
            this.execute(swapCommand);
        }
    }

    private execute(command: SwapCanvasesCommand | DuplicateCanvasCommand | ResetCanvasCommand): void {
        command.execute();
        this.drawingCommandManagerService.registerCommand(command);
    }
}
