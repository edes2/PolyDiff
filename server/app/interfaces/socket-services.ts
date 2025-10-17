import { UUIDType, UserAccount } from '@common/interfaces/user';
import { Socket } from 'socket.io';

export type DifferenceCounts = Map<UUIDType, number>;
export const DIFFERENCE_COUNT_ERROR = -1;

export interface Player {
    user: UserAccount;
}

export interface PlayerSocket extends Player {
    socket: Socket;
}

export interface PlayerInGame extends Player {
    diffCount: number;
}

export interface MultiGameCreation {
    owner: UUIDType;
    players: Player[];
}
