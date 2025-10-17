import { Injectable } from '@angular/core';
import { MouseButton } from '@app/enums/mouse';
import { Vec2 } from '@common/interfaces/vec2';

@Injectable({
    providedIn: 'root',
})
export abstract class BaseDrawingService {
    side: string;
    hasRegisteredCommand: boolean;

    protected mouseIsDown: boolean;
    protected frontCanvases: Map<string, HTMLCanvasElement>;

    setFrontCanvases(frontCanvases: Map<string, HTMLCanvasElement>) {
        this.frontCanvases = frontCanvases;
    }

    // eslint-disable-next-line no-unused-vars
    setDisplayCanvases(_: Map<string, HTMLCanvasElement>) {
        return;
    }

    // eslint-disable-next-line no-unused-vars, @typescript-eslint/naming-convention
    onMouseDown(_: MouseEvent, __: string, ___: number): void {
        return;
    }

    // eslint-disable-next-line no-unused-vars
    onMouseMove(_: MouseEvent): void {
        return;
    }

    // eslint-disable-next-line no-unused-vars
    onMouseUp(_: MouseEvent): void {
        return;
    }

    // eslint-disable-next-line no-unused-vars
    onKeyToggle(_: KeyboardEvent): void {
        return;
    }

    protected isLeftClick(event: MouseEvent): boolean {
        return event.button === MouseButton.Left;
    }

    protected extractCurrentPoint(event: MouseEvent): Vec2 {
        return { x: event.offsetX, y: event.offsetY };
    }
}
