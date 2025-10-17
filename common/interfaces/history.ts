import { UUIDType } from './user';

export interface GameHistory {
    date: string;
    startingTime: string;
    duration: string;
    gameMode: string;
    playersId: UUIDType[];
    winnerId?: UUIDType | null;
    rageQuittersId?: UUIDType[];
    differenceCounts?: [UUIDType, number][];
}

// This interface is used to send the data to the client side,
// adding the username of the players so that the client can
// display them in the history.
export interface EnrichedGameHistory extends GameHistory {
    playersUsername: string[];
}
