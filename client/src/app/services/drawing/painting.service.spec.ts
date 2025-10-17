/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { LineDrawingCommand } from '@app/classes/line-drawing-command';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { Vec2 } from '@common/interfaces/vec2';
import { PaintingService } from './painting.service';

describe('PaintingService', () => {
    let service: PaintingService;
    let mouseEventStub: MouseEvent;
    let canvasStub: HTMLCanvasElement;
    let commandStub: LineDrawingCommand;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PaintingService);
        mouseEventStub = new MouseEvent('mousedown');
        canvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        commandStub = new LineDrawingCommand(canvasStub, 'color', 1);
        service['frontCanvases'] = new Map();
        service['lineDrawingCommand'] = commandStub;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('onMouseDown should not call setStartingPointOnCanvas if isLeftClick returns false', () => {
        spyOn<any>(service, 'isLeftClick').and.returnValue(false);
        const setStartingPointOnCanvasSpy = spyOn<any>(service, 'setStartingPointOnCanvas');
        service.onMouseDown(mouseEventStub, 'red', 1);
        expect(setStartingPointOnCanvasSpy).not.toHaveBeenCalled();
    });

    it('onMouseDown should call setStartingPointOnCanvas if isLeftClick returns true', () => {
        spyOn<any>(service, 'isLeftClick').and.returnValue(true);
        const setStartingPointOnCanvasSpy = spyOn<any>(service, 'setStartingPointOnCanvas');
        service.onMouseDown(mouseEventStub, 'red', 1);
        expect(setStartingPointOnCanvasSpy).toHaveBeenCalled();
    });

    it('onMouseMove should call dragLine', () => {
        const dragLineSpy = spyOn<any>(service, 'dragLine');
        service.onMouseMove(mouseEventStub);
        expect(dragLineSpy).toHaveBeenCalled();
    });

    it('onMouseUp should set mouseIsDown to false if isLeftClick returns true', () => {
        spyOn<any>(service, 'isLeftClick').and.returnValue(true);
        service['mouseIsDown'] = true;
        spyOn(service['lineDrawingCommand'], 'closePath');
        service.onMouseUp(mouseEventStub);
        expect(service['mouseIsDown']).toEqual(false);
    });

    it('onMouseUp should call closePath on lineDrawingCommand if isLeftClick returns true', () => {
        spyOn<any>(service, 'isLeftClick').and.returnValue(true);
        const closePathSpy = spyOn(service['lineDrawingCommand'], 'closePath');
        service.onMouseUp(mouseEventStub);
        expect(closePathSpy).toHaveBeenCalled();
    });

    it('onMouseUp should call registerCommand on drawingCommandManagerService if isLeftClick returns true', () => {
        spyOn<any>(service, 'isLeftClick').and.returnValue(true);
        spyOn(service['lineDrawingCommand'], 'closePath');
        const registerCommandSpy = spyOn(service['drawingCommandManagerService'], 'registerCommand');
        service.onMouseUp(mouseEventStub);
        expect(registerCommandSpy).toHaveBeenCalled();
    });

    it('onMouseUp should not do anything if isLeftClick returns false', () => {
        spyOn<any>(service, 'isLeftClick').and.returnValue(false);
        service['mouseIsDown'] = true;
        const closePathSpy = spyOn(service['lineDrawingCommand'], 'closePath');
        const registerCommandSpy = spyOn(service['drawingCommandManagerService'], 'registerCommand');
        service.onMouseUp(mouseEventStub);
        expect(closePathSpy).not.toHaveBeenCalled();
        expect(registerCommandSpy).not.toHaveBeenCalled();
        expect(service['mouseIsDown']).toEqual(true);
    });

    it('dragLine should call extractCurrentPoint if mouse is down', () => {
        service['mouseIsDown'] = true;
        const extractCurrentPointSpy = spyOn<any>(service, 'extractCurrentPoint');
        spyOn<any>(service, 'drawPoint');
        service['dragLine'](mouseEventStub);
        expect(extractCurrentPointSpy).toHaveBeenCalledWith(mouseEventStub);
    });

    it('dragLine should call drawPoint if mouse is down', () => {
        const point: Vec2 = { x: Math.random(), y: Math.random() };
        service['mouseIsDown'] = true;
        spyOn<any>(service, 'extractCurrentPoint').and.returnValue(point);
        const drawPointSpy = spyOn<any>(service, 'drawPoint');
        service['dragLine'](mouseEventStub);
        expect(drawPointSpy).toHaveBeenCalledWith(point);
    });

    it('dragLine should not do anything if mouse is up', () => {
        service['mouseIsDown'] = false;
        const extractCurrentPointSpy = spyOn<any>(service, 'extractCurrentPoint');
        const drawPointSpy = spyOn<any>(service, 'drawPoint');
        service['dragLine'](mouseEventStub);
        expect(extractCurrentPointSpy).not.toHaveBeenCalled();
        expect(drawPointSpy).not.toHaveBeenCalled();
    });

    it('setStartingPointOnCanvas should call setStartingPoint', () => {
        spyOn(service['frontCanvases'], 'get').and.returnValue(canvasStub);
        const setStartingPointSpy = spyOn<any>(service, 'setStartingPoint');
        service['setStartingPointOnCanvas'](mouseEventStub, 'color', 1);
        expect(setStartingPointSpy).toHaveBeenCalled();
    });

    it('setStartingPoint should call extractCurrentPoint', () => {
        spyOn(service['lineDrawingCommand'], 'moveTo');
        const extractCurrentPointSpy = spyOn<any>(service, 'extractCurrentPoint');
        spyOn<any>(service, 'drawPoint');
        service['setStartingPoint'](mouseEventStub);
        expect(extractCurrentPointSpy).toHaveBeenCalled();
    });

    it('setStartingPoint should call moveTo on lineDrawingCommand', () => {
        const moveToSpy = spyOn(service['lineDrawingCommand'], 'moveTo');
        spyOn<any>(service, 'extractCurrentPoint');
        spyOn<any>(service, 'drawPoint');
        service['setStartingPoint'](mouseEventStub);
        expect(moveToSpy).toHaveBeenCalled();
    });

    it('setStartingPoint should call drawPoint', () => {
        spyOn(service['lineDrawingCommand'], 'moveTo');
        spyOn<any>(service, 'extractCurrentPoint');
        const drawPointSpy = spyOn<any>(service, 'drawPoint');
        service['setStartingPoint'](mouseEventStub);
        expect(drawPointSpy).toHaveBeenCalled();
    });

    it('drawPoint should call addPointToPath on lineDrawingCommand', () => {
        const point: Vec2 = { x: Math.random(), y: Math.random() };
        const addPointToPathSpy = spyOn(service['lineDrawingCommand'], 'addPointToPath');
        service['drawPoint'](point);
        expect(addPointToPathSpy).toHaveBeenCalledWith(point);
    });

    it('drawPoint should call drawPoint on lineDrawingCommand', () => {
        const point: Vec2 = { x: Math.random(), y: Math.random() };
        const drawPointSpy = spyOn(service['lineDrawingCommand'], 'drawPoint');
        service['drawPoint'](point);
        expect(drawPointSpy).toHaveBeenCalledWith(point);
    });
});
