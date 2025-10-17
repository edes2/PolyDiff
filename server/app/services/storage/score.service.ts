import { BEST_SCORES_1V1, BEST_SCORES_SOLO } from '@app/constants/card-info';
import { DB_COLLECTION_CARDINFOS } from '@app/env';
import { DatabaseService } from '@app/services/storage/database.service';
import { UserService } from '@app/services/storage/user.service';
import { CardInfo, EnrichedScore, Score } from '@common/interfaces/card-info';
import { Collection, WithId } from 'mongodb';
import { Service } from 'typedi';

@Service()
export class ScoreService {
    constructor(private databaseService: DatabaseService, private userService: UserService) {}

    get collection(): Collection<CardInfo> {
        return this.databaseService.database.collection(DB_COLLECTION_CARDINFOS);
    }

    async resetBestScores(cardId: string) {
        await this.collection.findOneAndUpdate({ id: cardId }, { $set: { bestScoresSolo: BEST_SCORES_SOLO, bestScores1v1: BEST_SCORES_1V1 } });
    }

    async resetBestScoresAllCards() {
        await this.collection.updateMany({}, { $set: { bestScoresSolo: BEST_SCORES_SOLO, bestScores1v1: BEST_SCORES_1V1 } });
    }

    async updateBestScores(cardId: string, newScores: Score[], isSolo: boolean): Promise<void> {
        if (isSolo) {
            await this.collection.findOneAndUpdate({ id: cardId }, { $set: { bestScoresSolo: newScores } });
        } else {
            await this.collection.findOneAndUpdate({ id: cardId }, { $set: { bestScores1v1: newScores } });
        }
    }

    // TODO: Track usage to remove username
    async getBestScores(cardId: string): Promise<WithId<CardInfo>> {
        return await this.collection
            .findOne({ id: cardId }, { projection: { _id: 0, bestScoresSolo: 1, bestScores1v1: 1 } })
            .then((score: WithId<CardInfo>) => {
                return score;
            });
    }

    async getScorePosition(cardId: string, newScore: Score, isSolo: boolean): Promise<number> {
        const scores = await this.getBestScores(cardId);
        if (!scores) {
            return 0;
        }
        const bestScores = isSolo ? scores.bestScoresSolo : scores.bestScores1v1;
        bestScores.push(newScore);
        bestScores.sort(this.compareScores);
        if (this.isNewRecord(bestScores, newScore)) {
            bestScores.pop();
            await this.updateBestScores(cardId, bestScores, isSolo);
            return bestScores.findIndex((score) => score === newScore) + 1;
        }
        return 0;
    }

    // This function is used to enrich the scores with the usernames of the players
    // so that we can display them in the card info page in the client
    async enrichScores(scores: Score[]): Promise<EnrichedScore[]> {
        const enrichedScores: EnrichedScore[] = [];
        for (const score of scores) {
            try {
                enrichedScores.push(await this.enrichScore(score));
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }
        return enrichedScores;
    }

    async enrichScore(score: Score): Promise<EnrichedScore> {
        const playerUsername = await this.userService.getUsernameById(score.playerId);
        if (!playerUsername) {
            throw new Error('Failed to find the username of the player');
        }
        return { ...score, playerUsername };
    }

    private compareScores(firstScore: Score, secondScore: Score): number {
        return firstScore.value - secondScore.value;
    }

    private isNewRecord(bestScores: Score[], newScore: Score): boolean {
        return bestScores[bestScores.length - 1] !== newScore;
    }
}
