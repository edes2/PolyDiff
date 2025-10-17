import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { CanvasTestHelper } from './canvas-test-helper';
import { SwapCanvasesCommand } from './swap-canvases-command';

describe('SwapCanvasesCommand', () => {
    let command: SwapCanvasesCommand;
    let firstCanvasStub: HTMLCanvasElement;
    let secondCanvasStub: HTMLCanvasElement;
    let firstContextStub: CanvasRenderingContext2D;
    let secondContextStub: CanvasRenderingContext2D;

    beforeEach(() => {
        command = new SwapCanvasesCommand();
        firstCanvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        secondCanvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        firstContextStub = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        secondContextStub = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
    });

    it('should create an instance', () => {
        expect(new SwapCanvasesCommand()).toBeTruthy();
    });

    it('setCanvas should call getImageData on both contexts', () => {
        command['firstContext'] = firstContextStub;
        command['secondContext'] = secondContextStub;
        spyOn(firstCanvasStub, 'getContext').and.returnValue(firstContextStub);
        spyOn(secondCanvasStub, 'getContext').and.returnValue(secondContextStub);
        const getImageDataSpy = spyOn(command['firstContext'], 'getImageData');
        command.setCanvas(firstCanvasStub, secondCanvasStub);
        expect(getImageDataSpy).toHaveBeenCalledTimes(2);
    });

    it('setCanvas should call getContext', async () => {
        command['firstContext'] = firstContextStub;
        command['secondContext'] = secondContextStub;
        const firstGetContextSpy = spyOn(firstCanvasStub, 'getContext').and.returnValue(firstContextStub);
        const secondGetContextSpy = spyOn(secondCanvasStub, 'getContext').and.returnValue(secondContextStub);
        spyOn(command['firstContext'], 'getImageData');
        command.setCanvas(firstCanvasStub, secondCanvasStub);
        expect(firstGetContextSpy).toHaveBeenCalled();
        expect(secondGetContextSpy).toHaveBeenCalled();
    });

    it('execute should call putImageData on both contexts', async () => {
        command['firstContext'] = firstContextStub;
        command['secondContext'] = secondContextStub;
        const putImageDataSpy = spyOn(command['firstContext'], 'putImageData');
        command.execute();
        expect(putImageDataSpy).toHaveBeenCalledTimes(2);
    });

    it('clearCanvas should call clearRect on both contexts', () => {
        command['firstContext'] = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        command['secondContext'] = secondCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        const firstClearRectSpy = spyOn(command['firstContext'], 'clearRect');
        const secondClearRectSpy = spyOn(command['secondContext'], 'clearRect');
        command.clearCanvas();
        expect(firstClearRectSpy).toHaveBeenCalled();
        expect(secondClearRectSpy).toHaveBeenCalled();
    });
});
