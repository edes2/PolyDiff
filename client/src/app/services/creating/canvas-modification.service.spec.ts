/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { HIGH_OPACITY, OPACITY_POS, PIXEL_LENGTH } from '@app/constants/bmp';
import { CanvasModificationService } from '@app/services/creating/canvas-modification.service';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { Vec2 } from '@common/interfaces/vec2';

describe('CanvasModificationService', () => {
    let service: CanvasModificationService;
    let canvasStub: HTMLCanvasElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [{ provide: CanvasRenderingContext2D, useValue: {} }],
        });
        service = TestBed.inject(CanvasModificationService);
        canvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('setCanvas should call getContext', () => {
        spyOn(canvasStub, 'getContext');
        service.setCanvas(canvasStub);
        expect(canvasStub.getContext).toHaveBeenCalledWith('2d', Object({ willReadFrequently: true }));
    });

    it('getIndexFromPosition convert x and y position to valid index number', () => {
        const randomNb = Math.floor(Math.random() * (IMAGE_WIDTH - 1));
        expect(service['getIndexFromPosition']({ x: randomNb, y: 0 })).toEqual(randomNb * PIXEL_LENGTH);
        expect(service['getIndexFromPosition']({ x: 0, y: IMAGE_HEIGHT - 1 })).toEqual(IMAGE_WIDTH * (IMAGE_HEIGHT - 1) * PIXEL_LENGTH);
        expect(service['getIndexFromPosition']({ x: IMAGE_HEIGHT, y: 0 })).toEqual(IMAGE_HEIGHT * PIXEL_LENGTH);
    });

    it('restorePixels should restore only the pixels which are passed as array to the function', () => {
        // NB: magic number disabled to avoid unecessary variables
        const originalImage: ImageData = new ImageData(2, 2);
        let modifiedImage: ImageData = new ImageData(2, 2);
        for (let index = 0; index < PIXEL_LENGTH * 3; index++) {
            modifiedImage.data[index] = 255;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'getIndexFromPosition').and.callFake((coord: Vec2) => {
            return coord.y * (2 * PIXEL_LENGTH) + coord.x * PIXEL_LENGTH;
        });
        modifiedImage = service.restorePixels(
            [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            originalImage,
            modifiedImage,
        );
        for (let index = 0; index < PIXEL_LENGTH - 1; index++) {
            expect(modifiedImage.data[index]).toEqual(originalImage.data[index]);
        }
        for (let index = PIXEL_LENGTH; index < 2 * PIXEL_LENGTH - 1; index++) {
            expect(modifiedImage.data[index]).not.toEqual(originalImage.data[index]);
        }
        for (let index = 2 * PIXEL_LENGTH; index < 3 * PIXEL_LENGTH - 1; index++) {
            expect(modifiedImage.data[index]).toEqual(originalImage.data[index]);
        }
        for (let index = 3 * PIXEL_LENGTH; index < 4 * PIXEL_LENGTH - 1; index++) {
            expect(modifiedImage.data[index]).toEqual(originalImage.data[index]);
        }
    });

    it('drawImageOnCanvas should call clearRect', () => {
        service.setCanvas(canvasStub);
        const imgData = new ImageData(480, 640);
        const spy = spyOn(service.context, 'clearRect');
        service.drawImageDataOnCanvas(imgData);
        expect(spy).toHaveBeenCalledWith(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    });

    it('drawImageOnCanvas should call clearRect and draw image', () => {
        service.setCanvas(canvasStub);
        const spyClearRect = spyOn(service.context, 'clearRect');
        const spyDrawImage = spyOn(service.context, 'drawImage');
        const imageStub: HTMLImageElement = new Image(1, 1);
        service.drawImageOnCanvas(imageStub);
        expect(spyClearRect).toHaveBeenCalled();
        expect(spyDrawImage).toHaveBeenCalled();
    });

    it('getImageDataFromCanvas should getImageData', () => {
        service.setCanvas(canvasStub);
        const spy = spyOn(service.context, 'getImageData');
        service.getImageDataFromCanvas();
        expect(spy).toHaveBeenCalledWith(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    });

    it('resetCanvas should call fillRect', () => {
        service.setCanvas(canvasStub);
        spyOn(service.context, 'fillRect');
        service.resetCanvas();
        expect(service.context.fillRect).toHaveBeenCalled();
    });

    it('changePixelsOpacity should set the opacity of the pixels which are passed as array to the function', () => {
        // NB: magic number disabled to avoid unecessary variable
        let image: ImageData = new ImageData(2, 2);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(service, 'getIndexFromPosition').and.callFake((coord: Vec2) => {
            return coord.y * (2 * PIXEL_LENGTH) + coord.x * PIXEL_LENGTH;
        });
        image = service.changePixelsOpacity(
            [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            image,
            HIGH_OPACITY,
        );
        expect(image.data[OPACITY_POS]).toEqual(HIGH_OPACITY);
        expect(image.data[PIXEL_LENGTH + OPACITY_POS]).not.toEqual(HIGH_OPACITY);
        expect(image.data[PIXEL_LENGTH * 2 + OPACITY_POS]).toEqual(HIGH_OPACITY);
        expect(image.data[PIXEL_LENGTH * 3 + OPACITY_POS]).not.toEqual(HIGH_OPACITY);
    });
});
