import { GameMode } from '@common/enums/mode';
import { PlayerInGame } from '../../server/app/interfaces/socket-services';
import { CardInfo } from './card-info';
import { PublicUserAccount, UUIDType } from './user';

export interface EndGameInfo {
    winner: PublicUserAccount | null;
    isTimeout?: boolean;
}

export interface PlayingInfo {
    cardInfo?: CardInfo; // Used for classic mode
    mode: GameMode;
    roomId: string;
    ownerId: UUIDType;
    players: PlayerInGame[];
}
export interface DifferenceCount {
    count: number;
    lastUpdate: number;
}
