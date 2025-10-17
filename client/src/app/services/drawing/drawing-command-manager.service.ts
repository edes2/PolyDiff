import { Injectable } from '@angular/core';
import { BaseDrawingCommand } from '@app/classes/base-drawing-command';
import { DuplicateCanvasCommand } from '@app/classes/duplicate-canvas-command';
import { ResetCanvasCommand } from '@app/classes/reset-canvas-command';
import { Stack } from '@app/classes/stack';
import { SwapCanvasesCommand } from '@app/classes/swap-canvases-command';

@Injectable({
    providedIn: 'root',
})
export class DrawingCommandManagerService {
    private undoStack = new Stack<BaseDrawingCommand | SwapCanvasesCommand | DuplicateCanvasCommand | ResetCanvasCommand | undefined>();
    private redoStack = new Stack<BaseDrawingCommand | SwapCanvasesCommand | DuplicateCanvasCommand | ResetCanvasCommand | undefined>();

    registerCommand(command: BaseDrawingCommand | SwapCanvasesCommand | DuplicateCanvasCommand | ResetCanvasCommand): void {
        this.undoStack.push(command);
    }

    redo(): void {
        const command = this.redoStack.pop();
        this.undoStack.push(command);
        command?.execute();
    }

    undo(): void {
        const command = this.undoStack.pop();
        command?.clearCanvas();
        this.redoStack.push(command);
        this.executeAllPreviousCommands();
    }

    clearRedoStack(): void {
        this.redoStack.clear();
    }

    undoStackIsEmpty(): boolean {
        return this.undoStack.isEmpty();
    }

    redoStackIsEmpty(): boolean {
        return this.redoStack.isEmpty();
    }

    private executeAllPreviousCommands(): void {
        for (const command of this.undoStack) {
            command?.execute();
        }
    }
}
