import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { CanvasTestHelper } from './canvas-test-helper';
import { ResetCanvasCommand } from './reset-canvas-command';

describe('ResetDrawingCommand', () => {
    let command: ResetCanvasCommand;
    let canvasStub: HTMLCanvasElement;

    beforeEach(() => {
        command = new ResetCanvasCommand();
        canvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
    });

    it('should create an instance', () => {
        expect(new ResetCanvasCommand()).toBeTruthy();
    });

    it('setCanvas should call getContext', () => {
        const getContextSpy = spyOn(canvasStub, 'getContext');
        command.setCanvas(canvasStub);
        expect(getContextSpy).toHaveBeenCalledWith('2d', Object({ willReadFrequently: true }));
    });

    it('execute should call clearCanvas', () => {
        const clearCanvasSpy = spyOn(command, 'clearCanvas');
        command.execute();
        expect(clearCanvasSpy).toHaveBeenCalled();
    });

    it('clearCanvas should call clearRect on context', () => {
        command['context'] = canvasStub.getContext('2d') as CanvasRenderingContext2D;
        const clearRectSpy = spyOn(command['context'], 'clearRect');
        command.clearCanvas();
        expect(clearRectSpy).toHaveBeenCalled();
    });
});
