import { Vec2 } from '@common/interfaces/vec2';
import Jimp from 'jimp';

export interface Direction {
    x: number;
    y: number;
    name: string;
}

export interface Directions {
    north: Direction;
    south: Direction;
    west: Direction;
    east: Direction;
}

export interface Difference {
    start: Vec2;
}

export interface Images {
    left: Jimp;
    right: Jimp;
    diff: Jimp;
}

export interface PixelVisitInfo {
    position: Vec2;
    direction: Direction;
    diffPosition: Vec2;
}
