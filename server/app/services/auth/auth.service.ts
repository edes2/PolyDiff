import { Firebase } from '@app/classes/firebase';
import { UserService } from '@app/services/storage/user.service';
import { UserInfoValidation } from '@app/services/validations/user-account.valdiation';
import { AccountCreationInfo, AccountCreationResult, AccountCreationStatus } from '@common/interfaces/account-creation';
import { UserAccount } from '@common/interfaces/user';
import { Service } from 'typedi';

@Service()
export class AuthService {
    private connectedUsers: string[] = [];

    constructor(private userService: UserService) {}

    async createAccount(info: AccountCreationInfo): Promise<AccountCreationResult> {
        const errorCode = await this.checkAccountCreationError(info);

        if (errorCode) {
            return { status: errorCode } as AccountCreationResult;
        }

        try {
            const userRecord = await Firebase.auth().createUser({
                email: info.email,
                password: info.password,
            });
            await this.userService.createUser({
                uid: userRecord.uid,
                username: info.username,
                email: info.email,
            } as UserAccount);

            return { status: AccountCreationStatus.SUCCESS, userId: userRecord.uid } as AccountCreationResult;
        } catch (error) {
            return { status: AccountCreationStatus.UNKNOWN_ERROR } as AccountCreationResult;
        }
    }

    isNewSession(uid: string): boolean {
        return !this.connectedUsers.includes(uid);
    }

    addNewUserSession(uid: string) {
        if (this.connectedUsers.includes(uid)) {
            throw new Error('User already connected');
        }
        this.connectedUsers.push(uid);
    }

    removeUserSession(uid: string) {
        if (this.connectedUsers.includes(uid)) {
            this.connectedUsers.splice(this.connectedUsers.indexOf(uid), 1);
        }
    }

    private async checkAccountCreationError(info: AccountCreationInfo): Promise<AccountCreationStatus | void> {
        if (!UserInfoValidation.isEmailValid(info.email)) {
            return AccountCreationStatus.INVALID_EMAIL;
        } else if (!UserInfoValidation.isUsernameValid(info.username)) {
            return AccountCreationStatus.INVALID_USERNAME;
        } else if (!UserInfoValidation.isPasswordValid(info.password)) {
            return AccountCreationStatus.INVALID_PASSWORD;
        } else if (!(await this.isEmailAvailable(info.email))) {
            return AccountCreationStatus.EMAIL_TAKEN;
        } else if (!(await this.userService.isUsernameAvailable(info.username))) {
            return AccountCreationStatus.USERNAME_TAKEN;
        }
    }

    private async isEmailAvailable(email: string): Promise<boolean> {
        try {
            await Firebase.auth().getUserByEmail(email); // If the email is already taken, this will throw an error
            return false;
        } catch (error) {
            return true;
        }
    }
}
