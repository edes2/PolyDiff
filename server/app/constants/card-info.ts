import { CardInfo } from '@common/interfaces/card-info';
import { ACCOUNTS_STUBS } from './accounts';

export const BEST_SCORES_SOLO = [
    { playerId: ACCOUNTS_STUBS[0].uid, value: 600 },
    { playerId: ACCOUNTS_STUBS[1].uid, value: 1200 },
    { playerId: ACCOUNTS_STUBS[2].uid, value: 1800 },
];

export const BEST_SCORES_1V1 = [
    { playerId: ACCOUNTS_STUBS[0].uid, value: 600 },
    { playerId: ACCOUNTS_STUBS[1].uid, value: 1200 },
    { playerId: ACCOUNTS_STUBS[2].uid, value: 1800 },
];

export const CARD_INFOS_STUBS: CardInfo[] = [
    {
        id: '1',
        name: 'Card1',
        difficulty: 'Facile',
        diffCount: 3,
        bestScoresSolo: BEST_SCORES_SOLO,
        bestScores1v1: BEST_SCORES_1V1,
    },
    {
        id: '2',
        name: 'Card2',
        difficulty: 'Facile',
        diffCount: 3,
        bestScoresSolo: BEST_SCORES_SOLO,
        bestScores1v1: BEST_SCORES_1V1,
    },
    {
        id: '3',
        name: 'Game3',
        difficulty: 'Facile',
        diffCount: 3,
        bestScoresSolo: BEST_SCORES_SOLO,
        bestScores1v1: BEST_SCORES_1V1,
    },
];
