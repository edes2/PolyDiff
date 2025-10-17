export const GAMES_HISTORY_STUB = [
    {
        date: new Date().toLocaleDateString('en-GB'),
        startingTime: '16:21:36',
        duration: '01:00',
        gameMode: 'Mode temps limité coop',
        playersId: ['1', '2', '3'],
        winnerId: '1',
        rageQuittersId: [],
        differenceCounts: [
            ['1', 5],
            ['2', 3],
            ['3', 2],
        ],
    },
    {
        date: new Date().toLocaleDateString('en-GB'),
        startingTime: '08:15:40',
        duration: '02:00',
        gameMode: 'Mode classique duo',
        playersId: ['1', '2'],
        winnerId: '2',
        rageQuittersId: [],
        differenceCounts: [
            ['1', 3],
            ['2', 5],
        ],
    },
];
