import { Queue } from '@app/classes/queue';
import { Images, PixelVisitInfo } from '@app/interfaces/difference-services';
import { PixelService } from '@app/services/differences/pixel.service';
import { Vec2 } from '@common/interfaces/vec2';
import Jimp from 'jimp';
import { Service } from 'typedi';

@Service()
export class DiffEnlargerService {
    private radius: number;

    constructor(private readonly pixelService: PixelService) {}

    setRadius(radius: number): void {
        this.radius = radius;
    }

    bfs(images: Images, position: Vec2): Jimp {
        images.diff = this.pixelService.drawBlack(images.diff, position);
        return this.bfsWithArray(images, new Queue<PixelVisitInfo>(this.pixelService.getPixelsToVisitStart(position)));
    }

    private bfsWithArray(images: Images, toVisit: Queue<PixelVisitInfo>): Jimp {
        const toVisitNext: Queue<PixelVisitInfo> = new Queue<PixelVisitInfo>();
        let pixel: PixelVisitInfo | undefined;
        while ((pixel = toVisit.shift())) {
            if (this.pixelService.isValidPosition(pixel.position) && !this.pixelService.isBlack(images.diff, pixel.position)) {
                if (!this.pixelService.isTheSame(images.left, images.right, pixel.position)) {
                    pixel.diffPosition = pixel.position;
                    images.diff = this.pixelService.drawBlack(images.diff, pixel.position);
                    toVisit.concat(this.pixelService.getAdjacents(pixel));
                } else if (this.isInEnlargementRadiusRange(pixel.position, pixel.diffPosition, this.radius)) {
                    toVisitNext.push(pixel);
                }
            }
        }
        return toVisitNext.size === 0 ? images.diff : this.bfsWithArrayEnlargement(images, toVisitNext);
    }

    private bfsWithArrayEnlargement(images: Images, toVisit: Queue<PixelVisitInfo>): Jimp {
        let pixel: PixelVisitInfo | undefined;
        while ((pixel = toVisit.shift())) {
            if (
                this.pixelService.isValidPosition(pixel.position) &&
                !this.pixelService.isBlack(images.diff, pixel.position) &&
                this.isInEnlargementRadiusRange(pixel.position, pixel.diffPosition, this.radius)
            ) {
                images.diff = this.pixelService.drawBlack(images.diff, pixel.position);
                toVisit.concat(this.pixelService.getAdjacents(pixel));
            }
        }
        return images.diff;
    }

    private isInEnlargementRadiusRange(position: Vec2, diffPosition: Vec2, radius: number): boolean {
        if (position !== diffPosition && radius !== 0) {
            return Math.pow(position.x - diffPosition.x, 2) + Math.pow(position.y - diffPosition.y, 2) <= Math.pow(radius, 2);
        }
        return false;
    }
}
