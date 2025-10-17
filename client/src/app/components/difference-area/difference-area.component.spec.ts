/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanvasService } from '@app/services/creating/canvas.service';
import { ImageVerificationService } from '@app/services/creating/image-verification.service';
import { CanvasCommandService } from '@app/services/drawing/canvas-command.service';
import { PaintingService } from '@app/services/drawing/painting.service';
import { RectangleDrawingService } from '@app/services/drawing/rectangle-drawing.service';
import { COMPONENT_STUBS } from '@app/stubs/component-stubs';
import { DifferenceAreaComponent } from './difference-area.component';
import SpyObj = jasmine.SpyObj;

describe('DifferenceAreaComponent', () => {
    let component: DifferenceAreaComponent;
    let fixture: ComponentFixture<DifferenceAreaComponent>;
    let canvasServiceSpy: SpyObj<CanvasService>;
    let canvasCommandServiceSpy: SpyObj<CanvasCommandService>;
    let paintingServiceSpy: SpyObj<PaintingService>;
    let rectangleDrawingServiceSpy: SpyObj<RectangleDrawingService>;
    let imageVerificationServiceSpy: SpyObj<ImageVerificationService>;
    let canvasStub: HTMLCanvasElement;
    let mouseEventStub: MouseEvent;
    let keyboardEventStub: KeyboardEvent;

    beforeEach(async () => {
        canvasServiceSpy = jasmine.createSpyObj('canvasService', ['add', 'reset', 'setupBack', 'setupFront', 'resetBothBackgrounds']);
        paintingServiceSpy = jasmine.createSpyObj('paintingService', ['onMouseMove', 'onMouseDown', 'onMouseUp', 'onKeyToggle']);
        rectangleDrawingServiceSpy = jasmine.createSpyObj('rectangleService', ['onKeyToggle']);
        canvasCommandServiceSpy = jasmine.createSpyObj('canvasCommandService', ['resetCanvas', 'duplicateCanvas', 'swapCanvases']);
        imageVerificationServiceSpy = jasmine.createSpyObj('imageVerificationService', ['isValidFile', 'convertFileToImage']);

        await TestBed.configureTestingModule({
            declarations: [DifferenceAreaComponent, ...COMPONENT_STUBS],
            providers: [
                { provide: PaintingService, useValue: paintingServiceSpy },
                { provide: CanvasService, useValue: canvasServiceSpy },
                { provide: CanvasCommandService, useValue: canvasCommandServiceSpy },
                { provide: ImageVerificationService, useValue: imageVerificationServiceSpy },
                { provide: RectangleDrawingService, useValue: rectangleDrawingServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DifferenceAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call the setupCanvas functions', () => {
        expect(canvasServiceSpy.setupBack).toHaveBeenCalled();
        expect(canvasServiceSpy.setupFront).toHaveBeenCalled();
    });

    it('should not call setFrontCanvases if the drawingCommand is undefined', () => {
        const mapGetSpy = spyOn(component.drawingCommandServices, 'get').and.returnValue(undefined);
        component.ngAfterViewInit();
        expect(mapGetSpy).toHaveBeenCalled();
        expect(mapGetSpy).toHaveBeenCalledTimes(4);
    });

    it('onMouseUp should call onMouseUp on currentCommandService if commandSelected and mouseOnCanvas is true', () => {
        spyOn<any>(component, 'commandSelected').and.returnValue(true);
        spyOn<any>(component, 'mouseIsOnCanvas').and.returnValue(true);
        component.currentCommandService = paintingServiceSpy;
        component.onMouseUp(mouseEventStub);
        expect(component.currentCommandService.onMouseUp).toHaveBeenCalledWith(mouseEventStub);
    });

    it('onMouseMove should call onMouseMove on currentCommandService if commandSelected and mouseIsDown is true', () => {
        spyOn<any>(component, 'commandSelected').and.returnValue(true);
        spyOn<any>(component, 'mouseIsOnCanvas').and.returnValue(true);
        component.currentCommandService = paintingServiceSpy;
        component.onMouseMove(mouseEventStub);
        expect(component.currentCommandService.onMouseMove).toHaveBeenCalledWith(mouseEventStub);
    });

    it('commandSelected should return true if selected command is defined', () => {
        component.selectedCommand = 'command';
        component.commandSelected();
        expect(component.commandSelected()).toBeTrue();
    });

    it('resetCanvas should call resetCanvas on canvasCommandService', () => {
        component.side = 'left';
        component.resetCanvas(component.side);
        const frontCanvas = component.frontCanvases.get(component.side) as HTMLCanvasElement;
        const displayCanvas = component.displayCanvases.get(component.side) as HTMLCanvasElement;
        expect(canvasCommandServiceSpy.resetCanvas).toHaveBeenCalledWith(frontCanvas, displayCanvas);
    });

    it('duplicateCanvas should call duplicateCanvas on canvasCommandService', () => {
        const sideToDuplicateFrom = 'left';
        const sideToDuplicateOnto = 'right';
        component.duplicateCanvas(sideToDuplicateFrom, sideToDuplicateOnto);
        const canvasToDuplicateFrom = component.frontCanvases.get(sideToDuplicateFrom) as HTMLCanvasElement;
        const canvasToDuplicateOnto = component.frontCanvases.get(sideToDuplicateOnto) as HTMLCanvasElement;
        expect(canvasCommandServiceSpy.duplicateCanvas).toHaveBeenCalledWith(canvasToDuplicateFrom, canvasToDuplicateOnto);
    });

    it('swapCanvases should call swapCanvases on canvasCommandService', () => {
        const sideToDuplicateFrom = 'left';
        const sideToDuplicateOnto = 'right';
        component.swapCanvases();
        const canvasToDuplicateFrom = component.frontCanvases.get(sideToDuplicateFrom) as HTMLCanvasElement;
        const canvasToDuplicateOnto = component.frontCanvases.get(sideToDuplicateOnto) as HTMLCanvasElement;
        expect(canvasCommandServiceSpy.swapCanvases).toHaveBeenCalledWith(canvasToDuplicateFrom, canvasToDuplicateOnto);
    });

    it('handleResetButton should call the canvas service reset function', () => {
        canvasServiceSpy.reset.and.returnValue();
        component.handleResetButton(canvasStub);
        expect(canvasServiceSpy.reset).toHaveBeenCalledOnceWith(canvasStub);
    });

    it('handleFileInput should not change the canvas if the input has no file', async () => {
        const mockEvent: any = { target: {} };
        await component.handleFileInput(mockEvent, canvasStub);
        expect(imageVerificationServiceSpy.isValidFile).not.toHaveBeenCalled();
        expect(canvasServiceSpy.add).not.toHaveBeenCalled();
    });

    it('handleFileInput should not change the canvas if the input file is invalid', async () => {
        const mockFile = new File(['test'], 'filename.bmp', { type: 'image/bmp' });
        const mockEvent: any = { target: { files: [mockFile] } };
        await component.handleFileInput(mockEvent, canvasStub);
        expect(imageVerificationServiceSpy.isValidFile).toHaveBeenCalledOnceWith(mockFile);
        expect(canvasServiceSpy.add).not.toHaveBeenCalled();
    });

    it('handleFileInput should call canvas service add if the file input is valid', async () => {
        const mockFile = new File(['test'], 'filename.bmp', { type: 'image/bmp' });
        const mockEvent: any = { target: { files: [mockFile] } };
        imageVerificationServiceSpy.isValidFile.and.returnValue(Promise.resolve(true));
        imageVerificationServiceSpy.convertFileToImage.and.returnValue(Promise.resolve(document.createElement('img')));
        canvasServiceSpy.add.and.callFake(async () => {});
        await component.handleFileInput(mockEvent, canvasStub);
        expect(imageVerificationServiceSpy.convertFileToImage).toHaveBeenCalled();
        expect(canvasServiceSpy.add).toHaveBeenCalled();
    });

    it('onMouseDown should call onMouseDown from currentCommandService if commandSelected is true', () => {
        const colorPickedStub = 'red';
        const thicknessPickedStub = 1;
        component.colorPicked = colorPickedStub;
        component.thicknessPicked = thicknessPickedStub;
        spyOn<any>(component, 'mouseIsOnCanvas').and.returnValue(true);
        spyOn<any>(component, 'commandSelected').and.returnValue(true);
        spyOn<any>(component['drawingCommandServices'], 'get').and.returnValue(paintingServiceSpy);
        component.currentCommandService = paintingServiceSpy;
        component.onMouseDown(mouseEventStub, 'left');
        expect(component.currentCommandService.onMouseDown).toHaveBeenCalledWith(mouseEventStub, colorPickedStub, thicknessPickedStub);
    });

    it('onKeyToggle should call onKeyToggle on currentCommandService if commandSelected is true', () => {
        spyOn<any>(component, 'commandSelected').and.returnValue(true);
        component.selectedCommand = 'drawRectangle';
        component.currentCommandService = rectangleDrawingServiceSpy;
        spyOn<any>(component['drawingCommandServices'], 'get').and.returnValue(rectangleDrawingServiceSpy);
        component.onKeyToggle(keyboardEventStub);
        expect(rectangleDrawingServiceSpy.onKeyToggle).toHaveBeenCalledWith(keyboardEventStub);
    });

    it('onKeyToggle should not call onKeyToggle on currentCommandService if it is undefined', () => {
        spyOn<any>(component, 'commandSelected').and.returnValue(true);
        component.selectedCommand = 'drawRectangle';
        component.currentCommandService = rectangleDrawingServiceSpy;
        spyOn<any>(component['drawingCommandServices'], 'get').and.returnValue(undefined);
        component.onKeyToggle(keyboardEventStub);
        expect(rectangleDrawingServiceSpy.onKeyToggle).not.toHaveBeenCalledWith(keyboardEventStub);
    });
});
