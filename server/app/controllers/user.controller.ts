import { extractUserInfo } from '@app/middleware/auth.middleware';
import { AuthService } from '@app/services/auth/auth.service';
import { UserService } from '@app/services/storage/user.service';
import { AccountCreationStatus } from '@common/interfaces/account-creation';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class UserController {
    unprotectedRouter: Router;
    protectedRouter: Router;

    constructor(private authService: AuthService, private userService: UserService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.unprotectedRouter = Router();
        this.protectedRouter = Router();

        this.unprotectedRouter.post('/signup', async (req: Request, res: Response) => {
            try {
                const { username, email, password } = req.body;
                const result = await this.authService.createAccount({ username, email, password });
                if (result.status === AccountCreationStatus.SUCCESS) {
                    res.status(StatusCodes.OK).json(result);
                } else {
                    res.status(StatusCodes.BAD_REQUEST).json(result);
                }
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
            }
        });

        this.protectedRouter.get('/profile', async (req: Request, res: Response) => {
            try {
                const profile = extractUserInfo(req);
                res.status(StatusCodes.OK).json(profile);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json();
            }
        });

        this.protectedRouter.get('/top20', async (req: Request, res: Response) => {
            try {
                const users = await this.userService.getTop20Users();
                res.status(StatusCodes.OK).json(users);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json();
            }
        });

        this.protectedRouter.put('/profile/language/:uid', async (req: Request, res: Response) => {
            try {
                const succes = await this.userService.updateLanguage(req.body.language, req.params.uid);
                res.status(StatusCodes.OK).json(succes);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json();
            }
        });

        this.protectedRouter.put('/profile/theme/:uid', async (req: Request, res: Response) => {
            try {
                const success = await this.userService.updateTheme(req.body.theme, req.params.uid);
                res.status(StatusCodes.OK).json(success);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json();
            }
        });

        this.protectedRouter.post('/username', async (req: Request, res: Response) => {
            try {
                const profile = extractUserInfo(req);
                const success = await this.userService.updateUsername(req.body.username, profile.uid);
                res.status(StatusCodes.OK).json(success);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json();
            }
        });

        this.protectedRouter.get('/connections/:uid', async (req: Request, res: Response) => {
            try {
                const connections = await this.userService.getConnections(req.params.uid);
                res.status(StatusCodes.OK).json(connections);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json();
            }
        });

        // Route pour obtenir le son du user en ce moment
        this.protectedRouter.get('/sound', async (req: Request, res: Response) => {
            try {
                const uid = extractUserInfo(req).uid;
                const sound = await this.userService.getCurrentSounds(uid);
                res.status(StatusCodes.OK).json(sound);
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json();
            }
        });

        // Route pour remplacer le son du user en ce moment
        this.protectedRouter.put('/sound', async (req: Request, res: Response) => {
            try {
                const uid = extractUserInfo(req).uid;
                if (req.body.sound) {
                    this.userService.saveSound(req.body.sound, uid, req.body.soundType);
                    res.send(true);
                }
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json();
            }
        });
    }
}
