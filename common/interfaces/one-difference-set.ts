import { ImageSet } from './image';
import { Vec2 } from './vec2';

export interface OneDifferenceImageSet extends ImageSet {
    difference: Vec2[];
}
