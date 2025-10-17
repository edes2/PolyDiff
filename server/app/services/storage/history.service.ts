import { DB_COLLECTION_GAMES_HISTORY } from '@app/env';
import { DatabaseService } from '@app/services/storage/database.service';
import { UserService } from '@app/services/storage/user.service';
import { EnrichedGameHistory, GameHistory } from '@common/interfaces/history';
import { UUIDType } from '@common/interfaces/user';
import { Collection, DeleteResult } from 'mongodb';
import { Service } from 'typedi';

@Service()
export class HistoryService {
    constructor(private databaseService: DatabaseService, private userService: UserService) {}

    get collection(): Collection<GameHistory> {
        return this.databaseService.database.collection(DB_COLLECTION_GAMES_HISTORY);
    }

    get currentDate(): string {
        return new Date().toLocaleDateString('en-GB');
    }

    async getAllGamesHistory(): Promise<GameHistory[]> {
        return await this.collection
            .find({}, { projection: { _id: 0 } })
            .sort({ _id: -1 })
            .toArray();
    }

    async getLastGames(uid: string): Promise<GameHistory[]> {
        return await this.collection
            .find({ playersId: { $in: [uid] } }, { projection: { _id: 0 } }) // Filter games where the uid is in the playersId array
            .sort({ _id: -1 }) // Sort the documents in descending order by _id
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            .limit(20)
            .toArray();
    }

    async addGameHistory(gameHistory: GameHistory): Promise<void> {
        await this.collection.insertOne(gameHistory);
    }

    async deleteAllGamesHistory(): Promise<DeleteResult> {
        return this.collection.deleteMany({}).catch(() => {
            throw new Error('Failed to delete the game history from the database');
        });
    }

    // This function is used to enrich the game history with the username of the players.
    // This is needed because the client side needs the username to display the history correctly
    // without having to make a request to the server for each game.
    async enrichGamesHistory(gamesHistory: GameHistory[]): Promise<EnrichedGameHistory[]> {
        const enrichedGamesHistory: EnrichedGameHistory[] = [];
        const knownUsernames = new Map<UUIDType, string>();
        for (const gameHistory of gamesHistory) {
            try {
                enrichedGamesHistory.push(await this.enrichGameHistory(gameHistory, knownUsernames));
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }
        return enrichedGamesHistory;
    }

    // This function is used to enrich a single game history with the username of the players.
    async enrichGameHistory(gameHistory: GameHistory, knownUsernames: Map<UUIDType, string>): Promise<EnrichedGameHistory> {
        const playersUsername: string[] = [];
        if (gameHistory.playersId) {
            for (const player of gameHistory.playersId) {
                const isKnown = knownUsernames.has(player);
                const username = knownUsernames.get(player) || (await this.userService.getUsernameById(player));
                if (!isKnown && username) knownUsernames.set(player, username);
                if (!username) throw new Error('Failed to enrich the game history');
                playersUsername.push(username);
            }
        }
        return {
            ...gameHistory,
            playersUsername,
        };
    }
}
