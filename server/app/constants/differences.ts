import { Direction, Directions } from '@app/interfaces/difference-services';

export const MINIMAL_DIFF_COUNT = 3;
export const MAXIMAL_DIFF_COUNT = 9;
export const HARD_DIFF_COUNT = 7;
export const HARD_DIFF_PERCENTAGE = 15;

export const DIRECTIONS: Directions = {
    north: { x: 0, y: -1, name: 'north' },
    south: { x: 0, y: 1, name: 'south' },
    west: { x: -1, y: 0, name: 'west' },
    east: { x: 1, y: 0, name: 'east' },
};

export const DIRECTIONS_LIST: Direction[] = [DIRECTIONS.north, DIRECTIONS.south, DIRECTIONS.west, DIRECTIONS.east];

export const ADJACENT_DIRECTIONS: Map<string, Direction[]> = new Map([
    ['north', [DIRECTIONS.north, DIRECTIONS.west, DIRECTIONS.east]],
    ['south', [DIRECTIONS.south, DIRECTIONS.west, DIRECTIONS.east]],
    ['west', [DIRECTIONS.west, DIRECTIONS.north, DIRECTIONS.south]],
    ['east', [DIRECTIONS.east, DIRECTIONS.north, DIRECTIONS.south]],
]);
