import { HttpException } from '@app/classes/http.exception';
import { GameController } from '@app/controllers/game.controller';
import { ImageController } from '@app/controllers/image.controller';
import { UserController } from '@app/controllers/user.controller';
import { verifyToken } from '@app/middleware/auth.middleware';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import { CardController } from './controllers/cards.controller';

@Service()
export class Application {
    app: express.Application;
    private readonly internalError: number = StatusCodes.INTERNAL_SERVER_ERROR;

    // eslint-disable-next-line max-params
    constructor(
        private readonly gameController: GameController,
        private readonly imageController: ImageController,
        private readonly userController: UserController,
        private readonly cardController: CardController,
    ) {
        this.app = express();
        this.config();
        this.bindRoutes();
    }

    bindRoutes(): void {
        this.bindUnprotectedRoutes();
        this.app.use('/api', verifyToken); // All routes below this line need authentication
        this.bindProtectedRoutes();
        this.errorHandling();
    }

    bindUnprotectedRoutes(): void {
        this.app.use('/api/users', this.userController.unprotectedRouter);
    }

    bindProtectedRoutes(): void {
        this.app.use('/api/cards', this.cardController.router);
        this.app.use('/api/games', this.gameController.router);
        this.app.use('/api/images', this.imageController.router);
        this.app.use('/api/users', this.userController.protectedRouter);
    }

    private config(): void {
        // Middlewares configuration
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use(cors());
    }

    private errorHandling(): void {
        // When previous handlers have not served a request: path wasn't found
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            const err: HttpException = new HttpException('Not Found');
            next(err);
        });

        // development error handler
        // will print stacktrace
        if (this.app.get('env') === 'development') {
            this.app.use((err: HttpException, req: express.Request, res: express.Response) => {
                res.status(err.status || this.internalError);
                res.send({
                    message: err.message,
                    error: err,
                });
            });
        }

        // production error handler
        // no stacktraces  leaked to user (in production env only)
        this.app.use((err: HttpException, req: express.Request, res: express.Response) => {
            res.status(err.status || this.internalError);
            res.send({
                message: err.message,
                error: {},
            });
        });
    }
}
