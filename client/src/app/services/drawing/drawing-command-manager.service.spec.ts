/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { RectangleDrawingCommand } from '@app/classes/rectangle-drawing-command';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { DrawingCommandManagerService } from '@app/services/drawing/drawing-command-manager.service';

describe('DrawingCommandManagerService', () => {
    let service: DrawingCommandManagerService;
    let commandStub: RectangleDrawingCommand;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DrawingCommandManagerService);
        const canvasStub: HTMLCanvasElement = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        commandStub = new RectangleDrawingCommand(canvasStub, 'red');
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('registerCommand should call push on undoStack', () => {
        const pushSpy = spyOn(service['undoStack'], 'push');
        service.registerCommand({} as any);
        expect(pushSpy).toHaveBeenCalled();
    });

    it('redo should call pop on redoStack', () => {
        spyOn(commandStub, 'execute');
        spyOn(service['undoStack'], 'push');
        const popSpy = spyOn(service['redoStack'], 'pop').and.returnValue(commandStub);
        service.redo();
        expect(popSpy).toHaveBeenCalled();
    });

    it('redo should call push on undoStack', () => {
        spyOn(service['redoStack'], 'pop').and.returnValue(commandStub);
        spyOn(commandStub, 'execute');
        const pushSpy = spyOn(service['undoStack'], 'push');
        service.redo();
        expect(pushSpy).toHaveBeenCalled();
    });

    it('redo should call execute on command', () => {
        spyOn(service['redoStack'], 'pop').and.returnValue(commandStub);
        spyOn(service['undoStack'], 'push');
        const executeSpy = spyOn(commandStub, 'execute');
        service.redo();
        expect(executeSpy).toHaveBeenCalled();
    });

    it('redo should not call execute if command is undefined', () => {
        spyOn(service['redoStack'], 'pop').and.returnValue(undefined);
        spyOn(service['undoStack'], 'push');
        const executeSpy = spyOn(commandStub, 'execute');
        service.redo();
        expect(executeSpy).not.toHaveBeenCalled();
    });

    it('undo should call pop on undoStack', () => {
        const popSpy = spyOn(service['undoStack'], 'pop').and.returnValue(commandStub);
        spyOn(commandStub, 'clearCanvas');
        spyOn(service['redoStack'], 'push');
        spyOn<any>(service, 'executeAllPreviousCommands');
        service.undo();
        expect(popSpy).toHaveBeenCalled();
    });

    it('undo should call clearCanvas on command', () => {
        spyOn(service['undoStack'], 'pop').and.returnValue(commandStub);
        const clearSpy = spyOn(commandStub, 'clearCanvas');
        spyOn(service['redoStack'], 'push');
        spyOn<any>(service, 'executeAllPreviousCommands');
        service.undo();
        expect(clearSpy).toHaveBeenCalled();
    });

    it('undo should not call clearCanvas if command is undefined', () => {
        spyOn(service['undoStack'], 'pop').and.returnValue(undefined);
        const clearSpy = spyOn(commandStub, 'clearCanvas');
        spyOn(service['redoStack'], 'push');
        spyOn<any>(service, 'executeAllPreviousCommands');
        service.undo();
        expect(clearSpy).not.toHaveBeenCalled();
    });

    it('undo should call push on redoStack', () => {
        spyOn(service['undoStack'], 'pop').and.returnValue(commandStub);
        spyOn(commandStub, 'clearCanvas');
        const pushSpy = spyOn(service['redoStack'], 'push');
        spyOn<any>(service, 'executeAllPreviousCommands');
        service.undo();
        expect(pushSpy).toHaveBeenCalled();
    });

    it('undo should call executeAllPreviousCommands', () => {
        spyOn(service['undoStack'], 'pop').and.returnValue(commandStub);
        spyOn(commandStub, 'clearCanvas');
        spyOn(service['redoStack'], 'push');
        const executeAllPreviousCommandsSpy = spyOn<any>(service, 'executeAllPreviousCommands');
        service.undo();
        expect(executeAllPreviousCommandsSpy).toHaveBeenCalled();
    });

    it('executeAllPreviousCommands should call execute on command from undoStack', () => {
        service['undoStack']['items'].push(commandStub);
        const executeSpy = spyOn(commandStub, 'execute');
        service['executeAllPreviousCommands']();
        expect(executeSpy).toHaveBeenCalled();
    });

    it('executeAllPreviousCommands should not call execute on command from undoStack if it is undefined', () => {
        service['undoStack']['items'].push(undefined);
        const executeSpy = spyOn(commandStub, 'execute');
        service['executeAllPreviousCommands']();
        expect(executeSpy).not.toHaveBeenCalled();
    });

    it('clearRedoStack should call clear on redoStack', () => {
        const clearSpy = spyOn(service['redoStack'], 'clear');
        service.clearRedoStack();
        expect(clearSpy).toHaveBeenCalled();
    });

    it('undoStackIsEmpty should call isEmpty on undoStack', () => {
        const isEmptySpy = spyOn(service['undoStack'], 'isEmpty');
        service.undoStackIsEmpty();
        expect(isEmptySpy).toHaveBeenCalled();
    });

    it('redoStackIsEmpty should call isEmpty on redoStack', () => {
        const isEmptySpy = spyOn(service['redoStack'], 'isEmpty');
        service.redoStackIsEmpty();
        expect(isEmptySpy).toHaveBeenCalled();
    });
});
