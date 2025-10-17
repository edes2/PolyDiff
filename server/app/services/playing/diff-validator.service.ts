import { Queue } from '@app/classes/queue';
import { PixelVisitInfo } from '@app/interfaces/difference-services';
import { PixelService } from '@app/services/differences/pixel.service';
import { ImageFileSystemService } from '@app/services/storage/image-file-system.service';
import { Vec2 } from '@common/interfaces/vec2';
import Jimp from 'jimp';
import { Container, Service } from 'typedi';

@Service()
export class DiffValidatorService {
    private diffImage: Jimp;

    static async getAllDifferencesById(cardId: string): Promise<Vec2[]> {
        const diffImage = await this.getDifferenceImage(cardId);
        return DiffValidatorService.getAllDifferenceImpl(diffImage);
    }

    static async expandDifference(position: Vec2, cardId: string): Promise<Vec2[]> {
        const diffImage = await DiffValidatorService.getDifferenceImage(cardId);
        return DiffValidatorService.expandDifferenceImpl(position, diffImage);
    }

    private static startBfs(position: Vec2, diffImage: Jimp): Vec2[] {
        const pixelService = Container.get(PixelService);
        diffImage = pixelService.drawWhite(diffImage, position);
        const queue = new Queue(pixelService.getPixelsToVisitStart(position));
        return DiffValidatorService.bfsWithArray(queue, diffImage).concat([position]);
    }

    private static bfsWithArray(toVisit: Queue<PixelVisitInfo>, diffImage: Jimp): Vec2[] {
        const pixelService = Container.get(PixelService);
        const difference: Vec2[] = [];
        let pixel: PixelVisitInfo | undefined;
        while ((pixel = toVisit.shift())) {
            if (pixelService.isValidPosition(pixel.position)) {
                if (pixelService.isBlack(diffImage, pixel.position)) {
                    difference.push(pixel.position);
                    pixelService.drawWhite(diffImage, pixel.position);
                    toVisit.concat(pixelService.getAdjacents(pixel));
                }
            }
        }
        return difference;
    }

    private static async getDifferenceImage(cardId: string) {
        const fileSystemService = Container.get(ImageFileSystemService);
        const diffImageUrlNoHeader = (await fileSystemService.getDifferenceImageById(cardId)).replace('data:image/png;base64', '');
        return await Jimp.read(Buffer.from(diffImageUrlNoHeader, 'base64'));
    }

    private static getAllDifferenceImpl(diffImage: Jimp) {
        const pixelService = Container.get(PixelService);
        const diff: Vec2[] = [];
        for (let x = 0; x < diffImage.getWidth(); x++) {
            for (let y = 0; y < diffImage.getHeight(); y++) {
                if (pixelService.isBlack(diffImage, { x, y })) {
                    diff.push({ x, y });
                }
            }
        }
        return diff;
    }

    private static expandDifferenceImpl(position: Vec2, diffImage: Jimp): Vec2[] {
        const pixelService = Container.get(PixelService);
        const isReallyADifference = pixelService.isBlack(diffImage, position);
        return isReallyADifference ? DiffValidatorService.startBfs(position, diffImage) : [];
    }

    getAllDifferences(): Vec2[] {
        return DiffValidatorService.getAllDifferenceImpl(this.diffImage);
    }

    async setDifferenceImage(cardId: string): Promise<void> {
        this.diffImage = await DiffValidatorService.getDifferenceImage(cardId);
    }

    async validateClick(position: Vec2): Promise<Vec2[] | undefined> {
        const pixelPositions = await this.getDifference(position);
        if (pixelPositions.length > 0) {
            return pixelPositions;
        }
        return undefined;
    }

    private getDifference(position: Vec2): Vec2[] {
        return DiffValidatorService.expandDifferenceImpl(position, this.diffImage);
    }
}
