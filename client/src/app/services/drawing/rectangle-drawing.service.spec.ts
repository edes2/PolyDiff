import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { RectangleDrawingCommand } from '@app/classes/rectangle-drawing-command';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { Vec2 } from '@common/interfaces/vec2';
import { RectangleDrawingService } from '@app/services/drawing/rectangle-drawing.service';

describe('RectangleDrawingService', () => {
    let service: RectangleDrawingService;
    let mouseEventStub: MouseEvent;
    let commandStub: RectangleDrawingCommand;
    let canvasStub: HTMLCanvasElement;
    let keyboardEventStub: KeyboardEvent;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let canvasesStub: Map<string, any>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RectangleDrawingService);
        canvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        commandStub = new RectangleDrawingCommand(canvasStub, 'color');
        service['rectangleDrawingCommand'] = commandStub;
        canvasesStub = new Map();
        canvasesStub.set('right', canvasStub).set('left', canvasStub);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('onMouseDown should call setStartingPointOnCanvas if isLeftClick is true', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'isLeftClick').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setStartingPointOnCanvasSpy = spyOn<any>(service, 'setStartingPointOnCanvas');
        service.onMouseDown(mouseEventStub, 'red');
        expect(setStartingPointOnCanvasSpy).toHaveBeenCalled();
    });

    it('onMouseMove should call dragRectangle', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dragRectangleSpy = spyOn<any>(service, 'dragRectangle');
        service.onMouseMove(mouseEventStub);
        expect(dragRectangleSpy).toHaveBeenCalled();
    });

    it('onMouseUp should call clearCanvas on rectangleDrawingCommand if isLeftClick and hasMoved return true', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'isLeftClick').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'hasMoved').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'drawPermanentRectangle');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'extractCurrentPoint');
        const clearCanvasSpy = spyOn(service['rectangleDrawingCommand'], 'clearCanvas');
        service.onMouseUp(mouseEventStub);
        expect(clearCanvasSpy).toHaveBeenCalled();
    });

    it('onMouseUp should call registerCommand on drawingCommandManagerService if isLeftClick and hasMoved return true', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'isLeftClick').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'hasMoved').and.returnValue(true);
        spyOn(service['rectangleDrawingCommand'], 'clearCanvas');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'drawPermanentRectangle');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'extractCurrentPoint');
        const registerCommandSpy = spyOn(service['drawingCommandManagerService'], 'registerCommand');
        service.onMouseUp(mouseEventStub);
        expect(registerCommandSpy).toHaveBeenCalled();
    });

    it('onKeyToggle should call dragRectangle', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dragRectangleSpy = spyOn<any>(service, 'dragRectangle');
        service.onKeyToggle(keyboardEventStub);
        expect(dragRectangleSpy).toHaveBeenCalled();
    });

    it('setDisplayCanvases should set displayCanvases', () => {
        service.setDisplayCanvases(canvasesStub);
        expect(service['displayCanvases']).toEqual(canvasesStub);
    });

    it('setStartingPointOnCanvas should set mouseIsDown to true and call the right methods', () => {
        service['mouseIsDown'] = true;
        service['displayCanvases'] = canvasesStub;
        spyOn(service['displayCanvases'], 'get');
        spyOn(RectangleDrawingCommand.prototype, 'setCanvas');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setStartingPointSpy = spyOn<any>(service, 'setStartingPoint');
        service['setStartingPointOnCanvas'](mouseEventStub, 'test-color');
        expect(setStartingPointSpy).toHaveBeenCalled();
    });

    it('displayRectangle should call clearCanvas on rectangleDrawingCommand', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'drawRectangle');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clearCanvasSpy = spyOn(service['rectangleDrawingCommand'], 'clearCanvas');
        service['displayRectangle'](mouseEventStub);
        expect(clearCanvasSpy).toHaveBeenCalled();
    });

    it('displayRectangle should call drawRectangle', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const drawRectangleSpy = spyOn<any>(service, 'drawRectangle');
        service['displayRectangle'](mouseEventStub);
        expect(drawRectangleSpy).toHaveBeenCalled();
    });

    it('dragRectangle should call displayRectangle if mouseIsDown is true', () => {
        service['mouseIsDown'] = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const displayRectangleSpy = spyOn<any>(service, 'displayRectangle');
        service['dragRectangle'](mouseEventStub);
        expect(displayRectangleSpy).toHaveBeenCalled();
    });

    it('calculateXYDistances should return a Vec2 with the right distances', () => {
        const startingPoint: Vec2 = { x: Math.random(), y: Math.random() };
        const endingPoint: Vec2 = { x: Math.random(), y: Math.random() };
        const distance = service['calculateXYDistances'](startingPoint, endingPoint);
        expect(distance.x).toEqual(endingPoint.x - startingPoint.x);
        expect(distance.y).toEqual(endingPoint.y - startingPoint.y);
    });

    it('setSquareDimensions should call setRectangleDimensions if both axis dimensions are positive', () => {
        const dimensions = { x: 2, y: 3 };
        const setRectangleDimensionsSpy = spyOn(service['rectangleDrawingCommand'], 'setRectangleDimensions');
        service['setSquareDimensions'](dimensions);
        expect(setRectangleDimensionsSpy).toHaveBeenCalled();
    });

    it('setSquareDimensions should call setRectangleDimensions if both axis dimensions are negative', () => {
        const dimensions = { x: -2, y: -3 };
        const setRectangleDimensionsSpy = spyOn(service['rectangleDrawingCommand'], 'setRectangleDimensions');
        service['setSquareDimensions'](dimensions);
        expect(setRectangleDimensionsSpy).toHaveBeenCalled();
    });

    it('setSquareDimensions should call setRectangleDimensions if both axis dimensions signs are different', () => {
        const dimensions = { x: 2, y: -3 };
        const setRectangleDimensionsSpy = spyOn(service['rectangleDrawingCommand'], 'setRectangleDimensions');
        service['setSquareDimensions'](dimensions);
        expect(setRectangleDimensionsSpy).toHaveBeenCalled();
    });

    it('setStartingPoint should call extractCurrentPoint', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extractCurrentPointSpy = spyOn<any>(service, 'extractCurrentPoint');
        spyOn(service['rectangleDrawingCommand'], 'setStartingPoint');
        service['setStartingPoint'](mouseEventStub);
        expect(extractCurrentPointSpy).toHaveBeenCalled();
    });

    it('setStartingPoint should call setStartingPoint on rectangleDrawingCommand', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'extractCurrentPoint');
        const setStartingPointSpy = spyOn(service['rectangleDrawingCommand'], 'setStartingPoint');
        service['setStartingPoint'](mouseEventStub);
        expect(setStartingPointSpy).toHaveBeenCalled();
    });

    it('setEndingPoint should call extractCurrentPoint if isLeftClick returns true', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'isLeftClick').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extractCurrentPointSpy = spyOn<any>(service, 'extractCurrentPoint');
        service['setEndingPoint'](mouseEventStub);
        expect(extractCurrentPointSpy).toHaveBeenCalled();
    });

    it('setEndingPoint should not call extractCurrentPoint if isLeftClick returns false', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'isLeftClick').and.returnValue(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extractCurrentPointSpy = spyOn<any>(service, 'extractCurrentPoint');
        service['setEndingPoint'](mouseEventStub);
        expect(extractCurrentPointSpy).not.toHaveBeenCalled();
    });

    it('drawPermanentRectangle should set mouseIsDown to false and call the right methods', () => {
        service['mouseIsDown'] = true;
        service['frontCanvases'] = canvasesStub;
        spyOn(service['frontCanvases'], 'get');
        const setCanvasSpy = spyOn(service['rectangleDrawingCommand'], 'setCanvas');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const drawRectangleSpy = spyOn<any>(service, 'drawRectangle');
        service['drawPermanentRectangle'](mouseEventStub);
        expect(service['mouseIsDown']).toEqual(false);
        expect(setCanvasSpy).toHaveBeenCalled();
        expect(drawRectangleSpy).toHaveBeenCalled();
    });

    it('drawRectangle should call the right methods if shiftKey is true', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setSquareDimensionsSpy = spyOn<any>(service, 'setSquareDimensions');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setEndingPointSpy = spyOn<any>(service, 'setEndingPoint');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calculateXYDistancesSpy = spyOn<any>(service, 'calculateXYDistances');
        const executeSpy = spyOn(service['rectangleDrawingCommand'], 'execute');
        const eventStub = { shiftKey: true };
        service['drawRectangle'](eventStub);
        expect(setEndingPointSpy).toHaveBeenCalled();
        expect(calculateXYDistancesSpy).toHaveBeenCalled();
        expect(executeSpy).toHaveBeenCalled();
        expect(setSquareDimensionsSpy).toHaveBeenCalled();
    });

    it('drawRectangle should call the right methods if shiftKey is false', () => {
        const setRectangleDimensionsSpy = spyOn(service['rectangleDrawingCommand'], 'setRectangleDimensions');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setEndingPointSpy = spyOn<any>(service, 'setEndingPoint');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calculateXYDistancesSpy = spyOn<any>(service, 'calculateXYDistances');
        const executeSpy = spyOn(service['rectangleDrawingCommand'], 'execute');
        const eventStub = { shiftKey: false };
        service['drawRectangle'](eventStub);
        expect(setEndingPointSpy).toHaveBeenCalled();
        expect(calculateXYDistancesSpy).toHaveBeenCalled();
        expect(executeSpy).toHaveBeenCalled();
        expect(setRectangleDimensionsSpy).toHaveBeenCalled();
    });

    it('hasMoved should return false if canvasEndingPoint equals canvasStartingPoint', () => {
        const point = { x: Math.random(), y: Math.random() };
        service['canvasStartingPoint'] = point;
        service['canvasEndingPoint'] = point;
        expect(service['hasMoved']()).toEqual(false);
    });

    it('hasMoved should return true if canvasEndingPoint is different from canvasStartingPoint', () => {
        service['canvasStartingPoint'] = { x: 0, y: 1 };
        service['canvasEndingPoint'] = { x: 1, y: 1 };
        expect(service['hasMoved']()).toEqual(true);
    });
});
