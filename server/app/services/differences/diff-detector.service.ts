import { Queue } from '@app/classes/queue';
import { HARD_DIFF_COUNT, HARD_DIFF_PERCENTAGE, MAXIMAL_DIFF_COUNT, MINIMAL_DIFF_COUNT } from '@app/constants/differences';
import { WHITE_RGBA_VALUE } from '@app/constants/image';
import { Difficulty } from '@app/enums/difficulty';
import { Difference, Images, PixelVisitInfo } from '@app/interfaces/difference-services';
import { DiffEnlargerService } from '@app/services/differences/diff-enlarger.service';
import { PixelService } from '@app/services/differences/pixel.service';
import { DifferenceImage } from '@common/interfaces/image';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { Vec2 } from '@common/interfaces/vec2';
import Jimp from 'jimp';
import { Service } from 'typedi';

@Service()
export class DiffDetectorService {
    private images: Images = {} as Images;

    private nbOfDiffPixels: number = 0;
    private differences: Difference[] = [];

    constructor(private readonly pixelService: PixelService, private readonly diffEnlarger: DiffEnlargerService) {}

    private get differenceCount(): number {
        return this.differences.length;
    }

    private get difficulty(): string {
        if (this.hasValidDifferenceCount()) {
            if (this.differenceCount >= HARD_DIFF_COUNT && this.getDifferencesPercentage() <= HARD_DIFF_PERCENTAGE) {
                return Difficulty.Difficile;
            }
            return Difficulty.Facile;
        }
        return Difficulty.Invalide;
    }

    private get differencesImageUrl(): Promise<string> {
        return this.images.diff.getBase64Async(Jimp.MIME_PNG);
    }

    private set radius(radiusSize: number) {
        this.diffEnlarger.setRadius(radiusSize);
    }

    async buildDifferenceImage(radiusSize: number, leftUrl: string, rightUrl: string): Promise<DifferenceImage> {
        this.radius = radiusSize;
        await this.setImages(leftUrl, rightUrl);
        this.compareImages();
        await this.joinDifferences();
        return {
            diffCount: this.differenceCount,
            difficulty: this.difficulty,
            uri: await this.differencesImageUrl,
        };
    }

    private hasValidDifferenceCount(): boolean {
        return this.differenceCount >= MINIMAL_DIFF_COUNT && this.differenceCount <= MAXIMAL_DIFF_COUNT;
    }

    private getDifferencesPercentage(): number {
        const percentage = 100;
        return Math.round((this.nbOfDiffPixels / (IMAGE_HEIGHT * IMAGE_WIDTH)) * percentage);
    }

    private async joinDifferences(): Promise<void> {
        const newDifferences = [];
        let difference: Difference | undefined;
        let diffImageCopy = await Jimp.read(this.images.diff);
        while ((difference = this.differences.pop())) {
            if (this.pixelService.isBlack(diffImageCopy, difference.start)) {
                newDifferences.push(difference);
                diffImageCopy = this.bfsJoinability(
                    diffImageCopy,
                    new Queue<PixelVisitInfo>(this.pixelService.getPixelsToVisitStart(difference.start)),
                );
            }
        }
        this.differences = newDifferences;
    }

    private async setImages(left: string, right: string): Promise<void> {
        const leftNoHeader = left.replace('data:image/png;base64', '');
        const rightNoHeader = right.replace('data:image/png;base64', '');
        this.images.left = await Jimp.read(Buffer.from(leftNoHeader, 'base64'));
        this.images.right = await Jimp.read(Buffer.from(rightNoHeader, 'base64'));
    }

    private compareImages() {
        this.differences = [];
        this.nbOfDiffPixels = 0;
        this.initDifferencesImage();
        this.compareImagesWithParam(this.images.left, this.images.right);
    }

    private initDifferencesImage(): void {
        this.images.diff = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT, WHITE_RGBA_VALUE);
    }

    private compareImagesWithParam(left: Jimp, right: Jimp): void {
        for (let y = 0; y < left.getHeight(); y++) {
            for (let x = 0; x < left.getWidth(); x++) {
                if (!this.pixelService.isTheSame(left, right, { x, y })) {
                    this.addDifference({ x, y });
                }
            }
        }
    }

    private addDifference(position: Vec2): void {
        if (!this.pixelService.isBlack(this.images.diff, position)) {
            this.updateDifferenceArray(position);
            this.startBfs(position);
        }
    }

    private updateDifferenceArray(position: Vec2) {
        this.differences.push({ start: position });
    }

    private startBfs(position: Vec2) {
        this.images.diff = this.diffEnlarger.bfs(this.images, position);
    }

    private bfsJoinability(image: Jimp, toVisit: Queue<PixelVisitInfo>): Jimp {
        let pixel: PixelVisitInfo | undefined;
        while ((pixel = toVisit.shift())) {
            if (this.pixelService.isValidPosition(pixel.position)) {
                if (this.pixelService.isBlack(image, pixel.position)) {
                    ++this.nbOfDiffPixels;
                    this.pixelService.drawWhite(image, pixel.position);
                    toVisit.concat(this.pixelService.getAdjacents(pixel));
                }
            }
        }
        return image;
    }
}
