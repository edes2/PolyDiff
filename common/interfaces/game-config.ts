import { GameMode } from '../enums/mode';

export interface GameConfig {
    mode: GameMode;
    duration: number;
    cheatingAllowed?: boolean;
    cardId?: string;
    timeBonus?: number;
}

export interface GameConfigClassic extends GameConfig {
    cardId: string;
}

export interface GameConfigLimited extends GameConfig {
    timeBonus: number;
}
