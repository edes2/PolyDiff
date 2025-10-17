import { GameConfig } from '@common/interfaces/game-config';
import { UUIDType } from '@common/interfaces/user';

export interface GameStatus {
    config: GameConfig;
    diffCount: number;
    roomId: string;
    rageQuitters: UUIDType[];
}
