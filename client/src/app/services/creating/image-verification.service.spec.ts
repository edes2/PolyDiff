/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { BMP_OFFSET_HEIGHT, BMP_OFFSET_NUMBER_OF_BITS_PER_PIXEL, BMP_OFFSET_WIDTH, DEFAUT_IMAGE_NUMBER_OF_BITS_PER_PIXEL } from '@app/constants/bmp';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { ImageVerificationService } from './image-verification.service';

describe('ImageVerificationService', () => {
    let service: ImageVerificationService;

    let dataView: DataView;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: MatDialog, useValue: { open: () => {} } }],
        });
        service = TestBed.inject(ImageVerificationService);

        const buffer: ArrayBuffer = new ArrayBuffer(30);
        dataView = new DataView(buffer);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('isValidFile should call verifyExtensionSpy, verifySizeSpy, verifyBitsSpy and return true', async () => {
        const fileStub = new File([''], 'filename', { type: 'text/html' });
        const verifyExtensionSpy = spyOn<any>(service, 'verifyExtension').and.returnValue(true);
        const verifySizeSpy = spyOn<any>(service, 'verifySize').and.returnValue(true);
        const verifyBitsSpy = spyOn<any>(service, 'verifyBits').and.returnValue(true);
        const returnValue: boolean = await service.isValidFile(fileStub);
        expect(verifyExtensionSpy).toHaveBeenCalled();
        expect(verifySizeSpy).toHaveBeenCalled();
        expect(verifyBitsSpy).toHaveBeenCalled();
        expect(returnValue).toBeTrue();
    });

    it('convertFileToImage should resolve if image is loaded', async () => {
        const url =
            // eslint-disable-next-line max-len
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
        const res = await fetch(url);
        const blob = await res.blob();
        const mockFile = new File([blob], 'filename.bmp', { type: 'image/bmp' });
        await expectAsync(service.convertFileToImage(mockFile)).toBeResolved();
    });

    it('convertFileToImage should reject if image is not loaded', async () => {
        const mockFile = new File([''], 'filename.bmp', { type: 'image/bmp' });
        await expectAsync(service.convertFileToImage(mockFile)).toBeRejected();
    });

    it('verifySize should return false with the wrong height or width', () => {
        expect(service['verifySize'](dataView)).toBeFalse();
    });

    it('verifySize should return true with the right height or width', () => {
        dataView.setUint16(BMP_OFFSET_WIDTH, IMAGE_WIDTH, true);
        dataView.setInt16(BMP_OFFSET_HEIGHT, IMAGE_HEIGHT, true);
        expect(service['verifySize'](dataView)).toBeTrue();
    });

    it('verifyBits should return false with the wrong number of bits per pixel', () => {
        expect(service['verifyBits'](dataView)).toBeFalse();
    });

    it('verifyBits should return true with the right number of bits per pixel', () => {
        dataView.setUint16(BMP_OFFSET_NUMBER_OF_BITS_PER_PIXEL, DEFAUT_IMAGE_NUMBER_OF_BITS_PER_PIXEL, true);
        expect(service['verifyBits'](dataView)).toBeTrue();
    });

    it('verifyExtension should return true the right file extension', () => {
        expect(service['verifyExtension']('file.bmp')).toBeTrue();
    });

    it('verifyExtension should return false with the wrong file extension', () => {
        expect(service['verifyExtension']('file.wrong')).toBeFalse();
    });
});
