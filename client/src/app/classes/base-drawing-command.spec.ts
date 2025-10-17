import { THEME_COLOR } from '@app/constants/theme';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { BaseDrawingCommand } from './base-drawing-command';
import { CanvasTestHelper } from './canvas-test-helper';

describe('BaseDrawingCommand', () => {
    let command: BaseDrawingCommand;
    let canvasStub: HTMLCanvasElement;
    const colorPicked = THEME_COLOR;

    beforeEach(() => {
        canvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        command = new BaseDrawingCommand(canvasStub, colorPicked);
    });

    it('should create an instance', () => {
        expect(command).toBeTruthy();
    });

    it('setCanvas should call getContext', () => {
        const getContextSpy = spyOn(canvasStub, 'getContext');
        command.setCanvas(canvasStub);
        expect(getContextSpy).toHaveBeenCalledWith('2d', Object({ willReadFrequently: true }));
    });

    it('clearContext should call clearRect', () => {
        const clearRectSpy = spyOn(command['context'], 'clearRect');
        command.clearCanvas();
        expect(clearRectSpy).toHaveBeenCalled();
    });

    it('execute should have a basic definition', () => {
        expect(command.execute()).toBeUndefined();
    });
});
