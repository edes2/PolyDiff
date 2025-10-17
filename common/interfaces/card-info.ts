import { UUIDType } from './user';

export interface Score {
    value: number;
    playerId: UUIDType;
}

// This interface is used to display the scores in the card info page in the client
export interface EnrichedScore extends Score {
    playerUsername: string;
}

export interface CardInfo {
    id: string;
    name: string;
    diffCount: number;
    difficulty: string;
    bestScoresSolo: Score[];
    bestScores1v1: Score[];
    rating?: number;
    numberOfRatings?: number;
}

// This interface is used to display the scores in the card info page in the client
export interface EnrichedCardInfo extends CardInfo {
    bestScoresSolo: EnrichedScore[];
    bestScores1v1: EnrichedScore[];
}

export interface CardCreationInfo {
    cardTitle?: string;
    diffCount: number;
    difficulty: string;
    leftImageUrl: string;
    rightImageUrl: string;
    diffImageUrl: string;
}
