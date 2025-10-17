import { Firebase } from '@app/classes/firebase';
import { UserService } from '@app/services/storage/user.service';
import { UserAccount } from '@common/interfaces/user';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Container } from 'typedi';

const USER_INFO = 'currentUser';

interface CustomRequest extends Request {
    currentUser?: UserAccount;
}

export const tokenToUserInfo = async (token: string): Promise<UserAccount> => {
    const decodedToken = await Firebase.auth().verifyIdToken(token as string);
    const user = await Container.get(UserService).getUserById(decodedToken.uid);

    if (!user) {
        throw new Error('User not found');
    }

    return user;
};

export const verifyToken = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const idToken = req.headers.authorization?.split(' ')[1];
        (req as any)[USER_INFO] = await tokenToUserInfo(idToken as string);
        next();
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json();
    }
};

export const extractUserInfo = (req: Request): UserAccount => {
    return (req as any)[USER_INFO];
};
