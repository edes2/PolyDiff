import { MusicService } from '@app/services/playing/music.service';
import { OneDifferenceImagesService } from '@app/services/playing/one-difference.service';
import { SocketManagerService } from '@app/services/playing/socket-manager.service';
import { HistoryService } from '@app/services/storage/history.service';
import { MusicType } from '@common/interfaces/music';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class GameController {
    router: Router;

    // eslint-disable-next-line max-params
    constructor(
        private readonly historyService: HistoryService,
        private readonly socketManager: SocketManagerService,
        private readonly oneDifferenceImageSet: OneDifferenceImagesService,
        private readonly musicService: MusicService,
    ) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/gameRooms', async (req: Request, res: Response) => {
            try {
                const gameRooms = this.socketManager.getWaitingRoomsForClients();
                if (!gameRooms) {
                    res.status(StatusCodes.NOT_FOUND).send();
                } else {
                    res.status(StatusCodes.OK).json(gameRooms);
                }
            } catch (error) {
                console.error(error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        });

        this.router.get('/random-one-difference-image-set', async (req: Request, res: Response) => {
            try {
                const cardsIdExclude = req.query.exclude ? (req.query.exclude as string).split(',') : undefined;
                const imageSet = await this.oneDifferenceImageSet.getRandomOneDifferenceImageSet(cardsIdExclude);
                if (!imageSet) {
                    res.status(StatusCodes.NOT_FOUND).send();
                } else {
                    res.status(StatusCodes.OK).json(imageSet);
                }
            } catch (error) {
                console.log(error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        });

        this.router.get('/playing-info/:gameOwnerId', async (req: Request, res: Response) => {
            try {
                const playingInfo = await this.socketManager.getPlayingInfo(req.params.gameOwnerId);
                if (!playingInfo) {
                    res.status(StatusCodes.NOT_FOUND).send();
                } else {
                    res.status(StatusCodes.OK).json(playingInfo);
                }
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        });
        this.router.get('/history', async (req: Request, res: Response) => {
            try {
                const gamesHistory = await this.historyService.getAllGamesHistory();
                const enrichedGamesHistory = await this.historyService.enrichGamesHistory(gamesHistory);
                res.send(enrichedGamesHistory);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/history/player/:uid', async (req: Request, res: Response) => {
            try {
                const uid = req.params.uid;
                const gamesHistory = await this.historyService.getLastGames(uid);
                const enrichedGamesHistory = await this.historyService.enrichGamesHistory(gamesHistory);
                res.send(enrichedGamesHistory);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.delete('/history', async (req: Request, res: Response) => {
            try {
                await this.historyService.deleteAllGamesHistory();
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        });

        this.router.get('/cheat/:gameOwnerId', async (req: Request, res: Response) => {
            try {
                const manager = await this.socketManager.getManager(req.params.gameOwnerId);
                if (manager) {
                    const cheat = await manager.getCheat();
                    console.log('sending cheat array: ', cheat);
                    res.status(StatusCodes.OK).json(cheat);
                }
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        });

        this.router.get('/random-music/:type', async (req: Request, res: Response) => {
            try {
                const type = req.params.type as MusicType;
                const music = this.musicService.getRandomMusic(type);
                if (!music) {
                    res.status(StatusCodes.NOT_FOUND).send();
                } else {
                    res.status(StatusCodes.OK).json(music);
                }
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
            }
        });
    }
}
