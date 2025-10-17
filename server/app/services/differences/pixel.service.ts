import { ADJACENT_DIRECTIONS, DIRECTIONS, DIRECTIONS_LIST } from '@app/constants/differences';
import { BLACK_RGBA_VALUE, WHITE_RGBA_VALUE } from '@app/constants/image';
import { Direction, PixelVisitInfo } from '@app/interfaces/difference-services';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { Vec2 } from '@common/interfaces/vec2';
import Jimp from 'jimp';
import { Service } from 'typedi';

@Service()
export class PixelService {
    getNextPixelWithDirection(pixel: PixelVisitInfo, direction: Direction): PixelVisitInfo {
        return { position: this.getPositionWithDirection(pixel.position, direction), direction, diffPosition: pixel.diffPosition };
    }

    getPixelsToVisitStart(position: Vec2): PixelVisitInfo[] {
        return this.getAllAdjacents({ position, direction: DIRECTIONS.north, diffPosition: position });
    }

    getAllAdjacents(pixel: PixelVisitInfo): PixelVisitInfo[] {
        return DIRECTIONS_LIST.map((direction) => this.getNextPixelWithDirection(pixel, direction));
    }

    getAdjacents(pixel: PixelVisitInfo): PixelVisitInfo[] {
        const directions = ADJACENT_DIRECTIONS.get(pixel.direction.name);
        return directions ? directions.map((direction) => this.getNextPixelWithDirection(pixel, direction)) : [];
    }

    isValidPosition(position: Vec2): boolean {
        return position.x >= 0 && position.x < IMAGE_WIDTH && position.y >= 0 && position.y < IMAGE_HEIGHT;
    }

    isTheSame(first: Jimp, second: Jimp, position: Vec2): boolean {
        return first.getPixelColor(position.x, position.y) === second.getPixelColor(position.x, position.y);
    }

    isBlack(image: Jimp, position: Vec2): boolean {
        return image.getPixelColor(position.x, position.y) === BLACK_RGBA_VALUE;
    }

    drawBlack(image: Jimp, position: Vec2): Jimp {
        return image.setPixelColor(BLACK_RGBA_VALUE, position.x, position.y);
    }

    drawWhite(image: Jimp, position: Vec2): Jimp {
        return image.setPixelColor(WHITE_RGBA_VALUE, position.x, position.y);
    }

    private getPositionWithDirection(position: Vec2, direction: Direction): Vec2 {
        return {
            x: position.x + direction.x,
            y: position.y + direction.y,
        };
    }
}
