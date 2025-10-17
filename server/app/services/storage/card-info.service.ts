import { BEST_SCORES_1V1, BEST_SCORES_SOLO } from '@app/constants/card-info';
import { DB_COLLECTION_CARDINFOS } from '@app/env';
import { DatabaseService } from '@app/services/storage/database.service';
import { ScoreService } from '@app/services/storage/score.service';
import { CardInfo, EnrichedCardInfo } from '@common/interfaces/card-info';
import { randomUUID } from 'crypto';
import { Collection, WithId } from 'mongodb';
import { Service } from 'typedi';
import { ImageFileSystemService } from './image-file-system.service';

@Service()
export class CardInfoService {
    constructor(private databaseService: DatabaseService, private scoreService: ScoreService, private imageService: ImageFileSystemService) {}

    get collection(): Collection<CardInfo> {
        return this.databaseService.database.collection(DB_COLLECTION_CARDINFOS);
    }

    buildCardInfo(cardTitle: string, cardDifficulty: string, differencesCount: number): CardInfo {
        return {
            id: randomUUID(),
            name: cardTitle,
            diffCount: differencesCount,
            difficulty: cardDifficulty,
            bestScores1v1: BEST_SCORES_1V1,
            bestScoresSolo: BEST_SCORES_SOLO,
        };
    }

    async getAllCardInfos(): Promise<EnrichedCardInfo[]> {
        const cardInfos = await this.collection.find({}, { projection: { _id: 0 } }).toArray();
        const availableCardInfos = this.filterAvailableCards(cardInfos) as WithId<CardInfo>[];
        return this.enrichCardInfos(availableCardInfos);
    }

    async getCardInfoById(cardId: string): Promise<EnrichedCardInfo> {
        return this.collection.findOne({ id: cardId }, { projection: { _id: 0 } }).then(async (cardInfo: WithId<CardInfo>) => {
            return this.enrichCardInfo(cardInfo);
        });
    }

    async addRating(cardId: string, newRating: number) {
        const cardInfo = await this.getCardInfoById(cardId);
        if (!cardInfo) {
            throw new Error('Card not found');
        }
        if (!cardInfo.numberOfRatings || !cardInfo.rating) {
            // eslint-disable-next-line prettier/prettier
            cardInfo.numberOfRatings = 1;
            cardInfo.rating = newRating;
        } else {
            cardInfo.numberOfRatings++;
            const stringNumber = ((cardInfo.rating * (cardInfo.numberOfRatings - 1) + newRating) / cardInfo.numberOfRatings).toFixed(2);
            cardInfo.rating = parseFloat(stringNumber);
        }

        this.modifyRatingCardInfo(cardId, cardInfo.rating, cardInfo.numberOfRatings);
    }

    async modifyRatingCardInfo(cardId: string, newRating: number, newNumberOfRatings: number) {
        const updateResult = await this.collection.updateOne({ id: cardId }, { $set: { rating: newRating, numberOfRatings: newNumberOfRatings } });
        if (updateResult.matchedCount === 0) {
            throw new Error('Card not found for updating rating');
        }
        if (updateResult.modifiedCount === 0) {
            throw new Error('Failed to update the rating of the card');
        }
    }

    async addCardInfo(cardInfo: CardInfo): Promise<void> {
        await this.collection.insertOne(cardInfo);
    }

    async deleteCard(cardId: string) {
        return this.collection.findOneAndDelete({ id: cardId }).catch(() => {
            throw new Error('Failed to delete the card');
        });
    }

    // This function is used to enrich the card infos with the usernames of the players
    // in the best scores so that we can display them in the card info page in the client
    async enrichCardInfos(cardInfos: WithId<CardInfo>[]): Promise<EnrichedCardInfo[]> {
        return Promise.all(cardInfos.map(async (cardInfo) => this.enrichCardInfo(cardInfo)));
    }

    async enrichCardInfo(cardInfo: CardInfo): Promise<EnrichedCardInfo> {
        const enrichedCardInfo: EnrichedCardInfo = {
            ...cardInfo,
            bestScores1v1: await this.scoreService.enrichScores(cardInfo.bestScores1v1),
            bestScoresSolo: await this.scoreService.enrichScores(cardInfo.bestScoresSolo),
        };
        return enrichedCardInfo;
    }

    private filterAvailableCards(cardInfos: CardInfo[]): CardInfo[] {
        return cardInfos.filter((cardInfo: CardInfo) => this.imageService.isCardInStorage(cardInfo.id));
    }
}
