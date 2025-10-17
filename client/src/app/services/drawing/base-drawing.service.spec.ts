/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { BaseDrawingService } from './base-drawing.service';

describe('BaseDrawing', () => {
    let service: BaseDrawingService;
    const frontCanvasesStub: Map<string, HTMLCanvasElement> = new Map();

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(BaseDrawingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have defined setDisplayCanvases', () => {
        expect(service.setDisplayCanvases({} as any)).toBeUndefined();
    });

    it('should have defined onMouseDown', () => {
        expect(service.onMouseDown({} as any, '', 0)).toBeUndefined();
    });

    it('should have defined onMouseMove', () => {
        expect(service.onMouseMove({} as any)).toBeUndefined();
    });

    it('should have defined onMouseUp', () => {
        expect(service.onMouseUp({} as any)).toBeUndefined();
    });

    it('should have defined onKeyToggle', () => {
        expect(service.onKeyToggle({} as any)).toBeUndefined();
    });

    it('setFrontCanvases should set front canvases', () => {
        service.setFrontCanvases(frontCanvasesStub);
        expect(service['frontCanvases']).toEqual(frontCanvasesStub);
    });

    it('extractCurrentPoint should return a Vec2 with the right coordinates', () => {
        const mouseEvent = { offsetX: 2, offsetY: 2 } as MouseEvent;
        const coordinates = service['extractCurrentPoint'](mouseEvent);
        expect(coordinates.x).toEqual(mouseEvent.offsetX);
        expect(coordinates.y).toEqual(mouseEvent.offsetY);
    });

    it('isLeftClick should return true if left mouse button is triggered', () => {
        const mouseClick = new MouseEvent('click', { button: 0 });
        expect(service['isLeftClick'](mouseClick)).toEqual(true);
    });

    it('isLeftClick should return false if left mouse button is not triggered', () => {
        const mouseClick = new MouseEvent('click', { button: 1 });
        expect(service['isLeftClick'](mouseClick)).toEqual(false);
    });
});
