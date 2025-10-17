import { MINIATURE_HEIGHT, MINIATURE_WIDTH } from '@app/constants/image';
import { ImageSet } from '@common/interfaces/image';
import fs from 'fs';
import Jimp from 'jimp';
import { Service } from 'typedi';

@Service()
export class ImageFileSystemService {
    getLeftFilePath(id: string): string {
        return `assets/img/left/${id}.bmp`;
    }

    getRightFilePath(id: string): string {
        return `assets/img/right/${id}.bmp`;
    }

    getDiffFilePath(id: string): string {
        return `assets/img/diff/${id}.bmp`;
    }

    getMiniaturePath(id: string): string {
        return `assets/img/miniature/${id}.png`;
    }

    getAvatarPath(id: string): string {
        return `assets/img/avatar/${id}.png`;
    }

    isCardInStorage(id: string): boolean {
        return fs.existsSync(this.getLeftFilePath(id)) && fs.existsSync(this.getRightFilePath(id)) && fs.existsSync(this.getDiffFilePath(id));
    }

    async avatarImageExists(id: string): Promise<boolean> {
        return fs.existsSync(this.getAvatarPath(id));
    }

    async imagesExist(id: string): Promise<boolean> {
        return fs.existsSync(this.getLeftFilePath(id)) && fs.existsSync(this.getRightFilePath(id));
    }

    async miniatureExist(id: string): Promise<boolean> {
        return fs.existsSync(this.getMiniaturePath(id));
    }

    async diffImageExist(id: string): Promise<boolean> {
        return fs.existsSync(this.getDiffFilePath(id));
    }

    async saveDiffImage(id: string, imageFile: string) {
        const imageWithHeader: string = await this.convertPngToBmpUrl(imageFile);
        const imageData: string = imageWithHeader.replace('data:image/bmp;base64,', '');
        await fs.promises.writeFile(this.getDiffFilePath(id), imageData, { encoding: 'base64' });
    }

    async saveLeftAndRightImages(id: string, leftImage: string, rightImage: string) {
        const letfImageHeader: string = await this.convertPngToBmpUrl(leftImage);
        const rightImageHeader: string = await this.convertPngToBmpUrl(rightImage);
        const leftImageData: string = letfImageHeader.replace('data:image/bmp;base64,', '');
        const rightImageData: string = rightImageHeader.replace('data:image/bmp;base64,', '');
        await fs.promises.writeFile(this.getRightFilePath(id), rightImageData, { encoding: 'base64' });
        await fs.promises.writeFile(this.getLeftFilePath(id), leftImageData, { encoding: 'base64' });
    }

    async saveMiniature(id: string, leftImage: string) {
        const leftImageData: string = leftImage.replace('data:image/png;base64,', '');
        const jimpImage = await Jimp.read(Buffer.from(leftImageData, 'base64'));
        jimpImage.resize(MINIATURE_WIDTH, MINIATURE_HEIGHT);
        const image = await jimpImage.getBase64Async(Jimp.MIME_PNG);
        const leftImageDataResized: string = image.replace('data:image/png;base64,', '');
        await fs.promises.writeFile(this.getMiniaturePath(id), leftImageDataResized, { encoding: 'base64' });
    }

    async saveAvatar(id: string, avatarImage: string) {
        const avatar: string = avatarImage.replace('data:image/png;base64,', '');
        const jimpImage = await Jimp.read(Buffer.from(avatar, 'base64'));
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        jimpImage.resize(128, 128);
        const image = await jimpImage.getBase64Async(Jimp.MIME_PNG);
        const avatarImageDataResized: string = image.replace('data:image/png;base64,', '');
        await fs.promises.writeFile(this.getAvatarPath(id), avatarImageDataResized, { encoding: 'base64' });
    }

    async deleteImages(id: string) {
        try {
            fs.unlinkSync(this.getLeftFilePath(id));
            fs.unlinkSync(this.getRightFilePath(id));
            fs.unlinkSync(this.getDiffFilePath(id));
            fs.unlinkSync(this.getMiniaturePath(id));
        } catch (e) {
            return;
        }
    }

    async getImageById(id: string): Promise<ImageSet> {
        try {
            const leftImageBmp = 'data:image/bmp;base64,' + (await fs.promises.readFile(this.getLeftFilePath(id), 'base64'));
            const rightImageBmp = 'data:image/bmp;base64,' + (await fs.promises.readFile(this.getRightFilePath(id), 'base64'));
            const leftUri = await this.convertBmpToPngUrl(leftImageBmp);
            const rightUri = await this.convertBmpToPngUrl(rightImageBmp);
            return { cardId: id, leftUri, rightUri };
        } catch (e) {
            return { cardId: id, leftUri: '', rightUri: '' };
        }
    }

    async getAvatarImage(id: string): Promise<string> {
        try {
            return 'data:image/png;base64,' + (await fs.promises.readFile(this.getAvatarPath(id), 'base64'));
        } catch (e) {
            return '';
        }
    }

    async getMiniatureImage(id: string): Promise<string> {
        try {
            return 'data:image/png;base64,' + (await fs.promises.readFile(this.getMiniaturePath(id), 'base64'));
        } catch (e) {
            return '';
        }
    }

    async getDifferenceImageById(id: string): Promise<string> {
        try {
            const diffImageBmp = 'data:image/bmp;base64,' + (await fs.promises.readFile(this.getDiffFilePath(id), 'base64'));
            return await this.convertBmpToPngUrl(diffImageBmp);
        } catch (e) {
            return '';
        }
    }

    async loadDefaultAvatar(): Promise<string> {
        return new Promise((resolve, reject) => {
            const imagePath = 'assets/default/default-avatar.png';

            fs.readFile(imagePath, 'base64', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    const dataUrl = `data:image/png;base64,${data}`;
                    resolve(dataUrl);
                }
            });
        });
    }

    async convertPngToBmpUrl(image: string): Promise<string> {
        const imageNoHeader: string = image.replace('data:image/png;base64,', '');
        const jimpImage = await Jimp.read(Buffer.from(imageNoHeader, 'base64'));
        return jimpImage.getBase64Async(Jimp.MIME_BMP);
    }

    async convertBmpToPngUrl(image: string): Promise<string> {
        const imageNoHeader: string = image.replace('data:image/bmp;base64,', '');
        const jimpImage = await Jimp.read(Buffer.from(imageNoHeader, 'base64'));
        return jimpImage.getBase64Async(Jimp.MIME_PNG);
    }
}
