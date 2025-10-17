import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '@app/components/alert/alert.component';
import { BMP_OFFSET_HEIGHT, BMP_OFFSET_NUMBER_OF_BITS_PER_PIXEL, BMP_OFFSET_WIDTH, DEFAUT_IMAGE_NUMBER_OF_BITS_PER_PIXEL } from '@app/constants/bmp';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';

@Injectable({
    providedIn: 'root',
})
export class ImageVerificationService {
    constructor(private matDialog: MatDialog) {}

    async isValidFile(file: File): Promise<boolean> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async () => {
                const dataView = new DataView(reader.result as ArrayBuffer);
                resolve(this.verifyExtension(file.name) && this.verifySize(dataView) && this.verifyBits(dataView));
            };
            reader.readAsArrayBuffer(file);
        });
    }

    async convertFileToImage(file: File): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const image = new Image();
                image.src = reader.result as string;
                image.addEventListener('load', () => {
                    resolve(image);
                });
                image.addEventListener('error', () => {
                    reject(image);
                });
            });
            reader.readAsDataURL(file);
        });
    }

    async resizeImage(dataUrl: string, size: number): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) return;

                canvas.width = size;
                canvas.height = size;
                ctx.drawImage(img, 0, 0, size, size);

                const resizedDataUrl = canvas.toDataURL('image/png');
                resolve(resizedDataUrl);
            };

            img.src = dataUrl;
        });
    }

    private verifySize(dataView: DataView): boolean {
        const height: number = Math.abs(dataView.getInt16(BMP_OFFSET_HEIGHT, true));
        const width: number = Math.abs(dataView.getInt16(BMP_OFFSET_WIDTH, true));
        if (height === IMAGE_HEIGHT && width === IMAGE_WIDTH) {
            return true;
        } else {
            this.matDialog.open(AlertComponent, { data: { message: "La résolution de l'image doit être exactement 640x480." } });
            return false;
        }
    }

    private verifyBits(dataView: DataView): boolean {
        const numberOfBits: number = dataView.getInt16(BMP_OFFSET_NUMBER_OF_BITS_PER_PIXEL, true);
        if (numberOfBits === DEFAUT_IMAGE_NUMBER_OF_BITS_PER_PIXEL) {
            return true;
        } else {
            this.matDialog.open(AlertComponent, { data: { message: "L'image doit avoir exactement 24 bits par pixel." } });
            return false;
        }
    }

    private verifyExtension(fileName: string): boolean {
        if (fileName.endsWith('.bmp')) {
            return true;
        } else {
            this.matDialog.open(AlertComponent, { data: { message: "Le seul format de fichier accepté pour l'image est bitmap (.bmp)." } });
            return false;
        }
    }
}
