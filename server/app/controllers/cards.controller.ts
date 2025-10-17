import { SocketManagerService } from '@app/services/playing/socket-manager.service';
import { CardInfoService } from '@app/services/storage/card-info.service';
import { ImageFileSystemService } from '@app/services/storage/image-file-system.service';
import { ScoreService } from '@app/services/storage/score.service';
import { CardInfo } from '@common/interfaces/card-info';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class CardController {
    router: Router;

    // We have made the choice of breaking the services so their responsabilities
    //   are very distinct that is why there are four needed.
    // eslint-disable-next-line max-params
    constructor(
        private readonly cardInfoService: CardInfoService,
        private readonly imageFileSystemService: ImageFileSystemService,
        private readonly scoreService: ScoreService,
        private readonly socketManager: SocketManagerService,
    ) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/', async (_: Request, res: Response) => {
            try {
                res.json(await this.cardInfoService.getAllCardInfos());
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
            }
        });

        this.router.get('/count', async (_: Request, res: Response) => {
            try {
                const cardInfos = await this.cardInfoService.getAllCardInfos();
                res.status(StatusCodes.OK).json(cardInfos.length);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
            }
        });

        this.router.get('/:cardId', async (req: Request, res: Response) => {
            try {
                const cardId = req.params.cardId;
                const cardInfo = await this.cardInfoService.getCardInfoById(cardId);
                if (!cardInfo) {
                    res.status(StatusCodes.NOT_FOUND).send();
                } else {
                    res.status(StatusCodes.OK).json(cardInfo);
                }
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        });

        this.router.put('/rating', async (req: Request, res: Response) => {
            try {
                const newRating = req.body.newRating;
                const cardId = req.body.cardId;
                await this.cardInfoService.addRating(cardId, newRating);
                res.status(StatusCodes.OK).json();
            } catch (error) {
                console.log(error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        });

        // ratingPut(cardId: string, newRating: number) {
        //     return this.http.put(`${this.baseUrl}/games/rating/`, { cardId, newRating });
        // }

        this.router.delete('/:cardId', async (req: Request, res: Response) => {
            try {
                const cardId = req.params.cardId;
                await this.imageFileSystemService.deleteImages(cardId);
                await this.socketManager.deleteCard(cardId);
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.delete('/', async (req: Request, res: Response) => {
            try {
                const cardInfos = await this.cardInfoService.getAllCardInfos();
                for (const card of cardInfos) {
                    await this.imageFileSystemService.deleteImages(card.id);
                    await this.cardInfoService.deleteCard(card.id);
                }
                await this.socketManager.broadcastCardsUpdate();
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.put('/scores/:cardId', async (req: Request, res: Response) => {
            try {
                const cardId = req.params.cardId;
                await this.scoreService.resetBestScores(cardId);
                res.status(StatusCodes.OK).json();
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
            }
        });

        this.router.put('/scores/', async (_: Request, res: Response) => {
            try {
                await this.scoreService.resetBestScoresAllCards();
                res.status(StatusCodes.OK).json();
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
            }
        });

        this.router.post('/', async (req: Request, res: Response) => {
            try {
                if (!Object.keys(req.body).length) {
                    res.sendStatus(StatusCodes.BAD_REQUEST);
                    return;
                }
                const cardInfo: CardInfo = this.cardInfoService.buildCardInfo(req.body.cardTitle, req.body.difficulty, req.body.diffCount);
                await this.imageFileSystemService.saveLeftAndRightImages(cardInfo.id, req.body.leftImageUrl, req.body.rightImageUrl);
                await this.imageFileSystemService.saveDiffImage(cardInfo.id, req.body.diffImageUrl);
                await this.imageFileSystemService.saveMiniature(cardInfo.id, req.body.leftImageUrl);
                await this.cardInfoService.addCardInfo(cardInfo);
                await this.socketManager.createCard(cardInfo);
                res.sendStatus(StatusCodes.CREATED);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });
    }
}
