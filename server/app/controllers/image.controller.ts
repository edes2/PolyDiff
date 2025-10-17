import { ImageFileSystemService } from '@app/services/storage/image-file-system.service';
import { DifferenceImage } from '@common/interfaces/image';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import { Service } from 'typedi';
import { Worker } from 'worker_threads';

@Service()
export class ImageController {
    router: Router;

    constructor(private readonly imageFileSystemService: ImageFileSystemService) {
        this.configureRouter();
    }

    private createWorker(workerPath: string, workerData: DifferenceImage): Worker {
        return new Worker(workerPath, { workerData });
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.post('/diff', async (req: Request, res: Response) => {
            try {
                if (!Object.keys(req.body).length) {
                    res.sendStatus(StatusCodes.BAD_REQUEST);
                    return;
                }
                const worker = this.createWorker(path.resolve(__dirname, '../services/differences/worker.js'), req.body);
                worker.on('error', () => res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR));
                worker.on('message', (differenceImage) => {
                    if (differenceImage === undefined) {
                        res.sendStatus(StatusCodes.BAD_REQUEST);
                        return;
                    }
                    res.json(differenceImage);
                });
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/:cardId', async (req: Request, res: Response) => {
            try {
                const cardId = req.params.cardId;
                if (!(await this.imageFileSystemService.imagesExist(cardId))) {
                    res.sendStatus(StatusCodes.NOT_FOUND);
                    return;
                }
                res.json(await this.imageFileSystemService.getImageById(cardId));
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/avatar/:uid', async (req: Request, res: Response) => {
            try {
                const isAvatarExist: boolean = await this.imageFileSystemService.avatarImageExists(req.params.uid);
                if (!isAvatarExist) {
                    const defaultAvatarUrl: string = await this.imageFileSystemService.loadDefaultAvatar();
                    await this.imageFileSystemService.saveAvatar(req.params.uid, defaultAvatarUrl);
                }
                res.json(await this.imageFileSystemService.getAvatarImage(req.params.uid));
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.put('/avatar', async (req: Request, res: Response) => {
            try {
                if (req.body.avatarUrl && req.body.uid) {
                    this.imageFileSystemService.saveAvatar(req.body.uid, req.body.avatarUrl);
                    res.send(true);
                }
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/miniature/:cardId', async (req: Request, res: Response) => {
            try {
                const cardId = req.params.cardId;
                if (!(await this.imageFileSystemService.miniatureExist(cardId))) {
                    res.sendStatus(StatusCodes.NOT_FOUND);
                    return;
                }
                res.json(await this.imageFileSystemService.getMiniatureImage(cardId));
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/diff/:cardId', async (req: Request, res: Response) => {
            try {
                const cardId = req.params.cardId;
                if (!(await this.imageFileSystemService.diffImageExist(cardId))) {
                    res.sendStatus(StatusCodes.NOT_FOUND);
                    return;
                }
                res.json(await this.imageFileSystemService.getDifferenceImageById(cardId));
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });
    }
}
