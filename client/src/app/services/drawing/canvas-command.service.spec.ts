import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { DuplicateCanvasCommand } from '@app/classes/duplicate-canvas-command';
import { ResetCanvasCommand } from '@app/classes/reset-canvas-command';
import { SwapCanvasesCommand } from '@app/classes/swap-canvases-command';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';

import { CanvasCommandService } from '@app/services/drawing/canvas-command.service';

describe('CanvasCommandService', () => {
    let service: CanvasCommandService;
    let firstCanvasStub: HTMLCanvasElement;
    let secondCanvasStub: HTMLCanvasElement;
    const commandStub: ResetCanvasCommand = new ResetCanvasCommand();

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CanvasCommandService);
        firstCanvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        secondCanvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('resetCanvas should call the right methods if both front and display canvases are different', () => {
        const firstCanvasContext = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        firstCanvasContext.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const setCanvasSpy = spyOn(ResetCanvasCommand.prototype, 'setCanvas');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeSpy = spyOn<any>(service, 'execute');
        service.resetCanvas(firstCanvasStub, secondCanvasStub);
        expect(executeSpy).toHaveBeenCalled();
        expect(setCanvasSpy).toHaveBeenCalled();
    });

    it('resetCanvas should not call any method if both front and display canvases are the same', () => {
        const setCanvasSpy = spyOn(ResetCanvasCommand.prototype, 'setCanvas');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeSpy = spyOn<any>(service, 'execute');
        service.resetCanvas(firstCanvasStub, secondCanvasStub);
        expect(executeSpy).not.toHaveBeenCalled();
        expect(setCanvasSpy).not.toHaveBeenCalled();
    });

    it('duplicateCanvas should call the right methods if both canvases are different', () => {
        const firstCanvasContext = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        firstCanvasContext.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const setCanvasSpy = spyOn(DuplicateCanvasCommand.prototype, 'setCanvas');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeSpy = spyOn<any>(service, 'execute');
        service.duplicateCanvas(firstCanvasStub, secondCanvasStub);
        expect(executeSpy).toHaveBeenCalled();
        expect(setCanvasSpy).toHaveBeenCalled();
    });

    it('duplicateCanvas should not call any method if both canvases are the same', () => {
        const setCanvasSpy = spyOn(DuplicateCanvasCommand.prototype, 'setCanvas');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeSpy = spyOn<any>(service, 'execute');
        service.resetCanvas(firstCanvasStub, secondCanvasStub);
        expect(executeSpy).not.toHaveBeenCalled();
        expect(setCanvasSpy).not.toHaveBeenCalled();
    });

    it('swapCanvases should call the right methods if both canvases are different', () => {
        const firstCanvasContext = firstCanvasStub.getContext('2d') as CanvasRenderingContext2D;
        firstCanvasContext.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const setCanvasSpy = spyOn(SwapCanvasesCommand.prototype, 'setCanvas');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeSpy = spyOn<any>(service, 'execute');
        service.swapCanvases(firstCanvasStub, secondCanvasStub);
        expect(executeSpy).toHaveBeenCalled();
        expect(setCanvasSpy).toHaveBeenCalled();
    });

    it('swapCanvases should not call any method if both canvases are the same', () => {
        const setCanvasSpy = spyOn(SwapCanvasesCommand.prototype, 'setCanvas');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const executeSpy = spyOn<any>(service, 'execute');
        service.swapCanvases(firstCanvasStub, secondCanvasStub);
        expect(executeSpy).not.toHaveBeenCalled();
        expect(setCanvasSpy).not.toHaveBeenCalled();
    });

    it('execute should call execute on command and registerCommand on drawingCommandManagerService', () => {
        const executeSpy = spyOn(commandStub, 'execute');
        const registerCommandSpy = spyOn(service['drawingCommandManagerService'], 'registerCommand');
        service['execute'](commandStub);
        expect(executeSpy).toHaveBeenCalled();
        expect(registerCommandSpy).toHaveBeenCalled();
    });
});
