// import { AbstractManager } from '../../server/app/classes/abstract-manager';
import { PlayerSocket } from '../../server/app/interfaces/socket-services';
import { GameMode } from '../enums/mode';
import { PublicUserAccount, UUIDType } from './user';

export interface WaitingRoom {
    cardId?: string;
    roomId: string;
    players: PlayerSocket[];
    owner: UUIDType;
    mode: GameMode;
}

// Lighter version of WaitingRoom with no sensitive data that will be send to clients
export interface WaitingRoomDTO {
    cardId?: string;
    roomId: string;
    players: PublicUserAccount[];
    ownerId: UUIDType;
    mode: GameMode;
}
