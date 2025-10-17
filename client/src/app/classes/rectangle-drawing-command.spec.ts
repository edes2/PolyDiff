import { THEME_COLOR } from '@app/constants/theme';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { Vec2 } from '@common/interfaces/vec2';
import { CanvasTestHelper } from './canvas-test-helper';
import { RectangleDrawingCommand } from './rectangle-drawing-command';

describe('RectangleDrawingCommand', () => {
    let command: RectangleDrawingCommand;
    let canvasStub: HTMLCanvasElement;
    const colorPicked = THEME_COLOR;

    beforeEach(() => {
        canvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        command = new RectangleDrawingCommand(canvasStub, colorPicked);
    });

    it('should create an instance', () => {
        expect(command).toBeTruthy();
    });

    it('setStartingPoint should correctly set the starting point on the canvas', () => {
        const startingPoint: Vec2 = { x: Math.random(), y: Math.random() };
        command.setStartingPoint(startingPoint);
        expect(command['startingPoint']).toEqual(startingPoint);
    });

    it('setRectangleDimensions should correctly set the rectangle dimensions', () => {
        const rectangleDimensions: Vec2 = { x: Math.random(), y: Math.random() };
        command.setRectangleDimensions(rectangleDimensions);
        expect(command['rectangleDimensions']).toEqual(rectangleDimensions);
    });

    it('execute should call fillRect on context', () => {
        command['startingPoint'] = { x: Math.random(), y: Math.random() };
        command['rectangleDimensions'] = { x: Math.random(), y: Math.random() };
        const fillRectSpy = spyOn(command['context'], 'fillRect');
        command.execute();
        expect(fillRectSpy).toHaveBeenCalled();
    });

    it('execute should correctly set fillStyle and globalCompositeOperation on context', () => {
        command['startingPoint'] = { x: Math.random(), y: Math.random() };
        command['rectangleDimensions'] = { x: Math.random(), y: Math.random() };
        command.execute();
        expect(command['context'].fillStyle).toEqual(colorPicked);
        expect(command['context'].globalCompositeOperation).toEqual('source-over');
    });
});
