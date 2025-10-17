import { UUIDType } from './user';

export interface AccountCreationInfo {
    username: string;
    password: string;
    email: string;
}

export enum AccountCreationStatus {
    SUCCESS,
    INVALID_EMAIL,
    INVALID_USERNAME,
    INVALID_PASSWORD,
    EMAIL_TAKEN,
    USERNAME_TAKEN,
    UNKNOWN_ERROR,
}

export interface AccountCreationResult {
    status: AccountCreationStatus;
    userId?: UUIDType;
}
