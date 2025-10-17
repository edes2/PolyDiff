export type UUIDType = string;

export interface UserAccount {
    uid: UUIDType;
    username: string;
    email: string;
    wins?: number;
    losses?: number;
}

// Lighter version of UserAccount with no sensitive data that can be send to other users
export interface PublicUserAccount {
    uid: UUIDType;
    username: string;
}

// Convert a UserAccount to a PublicUserAccount. We don't use TypeScript type casting to have
// the freedom to rename fields if needed.
export const convertToPublicUserAccount = (user: UserAccount): PublicUserAccount => {
    return {
        uid: user.uid,
        username: user.username,
    };
};
