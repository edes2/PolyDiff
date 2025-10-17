/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Vec2 } from '@common/interfaces/vec2';
import { BaseDrawingCommand } from './base-drawing-command';
import { Queue } from './queue';
export class FillDrawingCommand extends BaseDrawingCommand {
    private startingPoint: Vec2;
    private width: number;
    private height: number;

    setStartingPoint(point: Vec2): void {
        this.startingPoint = point;
    }

    execute(): void {
        this.context.fillStyle = this.colorPicked;
        this.context.globalCompositeOperation = 'source-over';

        const imageData = this.context.getImageData(0, 0, this.context.canvas.width, this.context.canvas.height);
        const pixels = imageData.data;

        const targetColor = this.getColorAtStartingPoint(imageData);
        const fillColor = this.convertHexToRGBA(this.colorPicked);

        if (targetColor !== fillColor) {
            this.width = imageData.width;
            this.height = imageData.height;
            this.floodFill(this.startingPoint.x, this.startingPoint.y, targetColor, fillColor, pixels);
            this.context.putImageData(imageData, 0, 0);
        }
    }

    private convertHexToRGBA(hex: string, alpha: number = 1): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    private getColorAtStartingPoint(imageData: ImageData): string {
        const index = (this.startingPoint.y * imageData.width + this.startingPoint.x) * 4;
        return `rgba(${imageData.data[index]}, ${imageData.data[index + 1]}, ${imageData.data[index + 2]}, ${imageData.data[index + 3] / 255})`;
    }

    // eslint-disable-next-line max-params
    private floodFill(x: number, y: number, targetColor: string, fillColor: string, pixels: Uint8ClampedArray): void {
        const seedColor = this.getColorComponents(targetColor);
        const colorToFill = this.getColorComponents(fillColor);

        if (!this.isValid(x, y, pixels, colorToFill, seedColor)) {
            return;
        }
        const pixelQueue: Queue<Vec2> = new Queue<Vec2>();
        pixelQueue.push({ x, y });
        this.setColor(pixels, this.getIndex(x, y), colorToFill);

        while (pixelQueue.size > 0 && pixelQueue.size < 1000) {
            const current: Vec2 = pixelQueue.shift() as Vec2;

            if (this.isValid(current.x + 1, current.y, pixels, colorToFill, seedColor)) {
                this.setColor(pixels, this.getIndex(current.x + 1, current.y), colorToFill);
                pixelQueue.push({ x: current.x + 1, y: current.y });
            }

            if (this.isValid(current.x - 1, current.y, pixels, colorToFill, seedColor)) {
                this.setColor(pixels, this.getIndex(current.x - 1, current.y), colorToFill);
                pixelQueue.push({ x: current.x - 1, y: current.y });
            }

            if (this.isValid(current.x, current.y + 1, pixels, colorToFill, seedColor)) {
                this.setColor(pixels, this.getIndex(current.x, current.y + 1), colorToFill);
                pixelQueue.push({ x: current.x, y: current.y + 1 });
            }

            if (this.isValid(current.x, current.y - 1, pixels, colorToFill, seedColor)) {
                this.setColor(pixels, this.getIndex(current.x, current.y - 1), colorToFill);
                pixelQueue.push({ x: current.x, y: current.y - 1 });
            }
        }
    }

    // eslint-disable-next-line max-params
    private isValid(
        x: number,
        y: number,
        pixels: Uint8ClampedArray,
        color: [number, number, number, number],
        originalColor: [number, number, number, number],
    ): boolean {
        if (!this.isSameColor(pixels, this.getIndex(x, y), originalColor)) {
            return false;
        }
        if (this.isSameColor(pixels, this.getIndex(x, y), color)) {
            return false;
        }
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return true;
    }

    private getColorComponents(color: string): [number, number, number, number] {
        // Assuming color is in 'rgba(r, g, b, a)' format
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const components = color.match(/\d+/g)!.map(Number);
        return [components[0], components[1], components[2], components[3] * 255];
    }

    private isSameColor(pixels: Uint8ClampedArray, pos: number, color: [number, number, number, number]): boolean {
        return pixels[pos] === color[0] && pixels[pos + 1] === color[1] && pixels[pos + 2] === color[2] && pixels[pos + 3] === color[3];
    }

    private getIndex(x: number, y: number): number {
        const index: number = (y * this.width + x) * 4;
        return index;
    }

    private setColor(pixels: Uint8ClampedArray, pos: number, color: [number, number, number, number]): void {
        pixels[pos] = color[0];
        pixels[pos + 1] = color[1];
        pixels[pos + 2] = color[2];
        pixels[pos + 3] = color[3];
    }
}
