import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { CanvasTestHelper } from './canvas-test-helper';
import { DuplicateCanvasCommand } from './duplicate-canvas-command';

describe('DuplicateCanvasCommand', () => {
    let command: DuplicateCanvasCommand;
    let firstCanvasStub: HTMLCanvasElement;
    let secondCanvasStub: HTMLCanvasElement;

    beforeEach(() => {
        command = new DuplicateCanvasCommand();
        firstCanvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        secondCanvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
    });

    it('should create an instance', () => {
        expect(new DuplicateCanvasCommand()).toBeTruthy();
    });

    it('setCanvas should call getContext', () => {
        const firstGetContextSpy = spyOn(firstCanvasStub, 'getContext').and.callThrough();
        const secondGetContextSpy = spyOn(secondCanvasStub, 'getContext').and.callThrough();
        command.setCanvas(firstCanvasStub, secondCanvasStub);
        expect(firstGetContextSpy).toHaveBeenCalledWith('2d', Object({ willReadFrequently: true }));
        expect(secondGetContextSpy).toHaveBeenCalledWith('2d', Object({ willReadFrequently: true }));
    });

    it('setCanvas should call getImageData', () => {
        spyOn(firstCanvasStub, 'getContext').and.callThrough();
        spyOn(secondCanvasStub, 'getContext').and.callThrough();
        command['contextToDuplicateFrom'] = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        const getImageDataSpy = spyOn(command['contextToDuplicateFrom'], 'getImageData');
        command.setCanvas(firstCanvasStub, secondCanvasStub);
        expect(getImageDataSpy).toHaveBeenCalled();
    });

    it('excute should call clearCanvas', () => {
        command['contextToDuplicateOnto'] = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        command['contextToDuplicateFrom'] = secondCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        const clearCanvasSpy = spyOn(command, 'clearCanvas');
        spyOn(command['contextToDuplicateOnto'], 'putImageData');
        command.execute();
        expect(clearCanvasSpy).toHaveBeenCalled();
    });

    it('excute should call drawImage on the canvas to duplicate onto', () => {
        command['contextToDuplicateOnto'] = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        command['contextToDuplicateFrom'] = secondCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        spyOn(command, 'clearCanvas');
        const putImageDataSpy = spyOn(command['contextToDuplicateOnto'], 'putImageData');
        command.execute();
        expect(putImageDataSpy).toHaveBeenCalled();
    });

    it('clearCanvas should call clearRect on canvas to duplicate onto', () => {
        command['contextToDuplicateOnto'] = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        const clearRectSpy = spyOn(command['contextToDuplicateOnto'], 'clearRect');
        command.clearCanvas();
        expect(clearRectSpy).toHaveBeenCalled();
    });
});
