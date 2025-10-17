import { DatabaseService } from '@app/services/storage/database.service';
import { UserService } from '@app/services/storage/user.service';
import { UserAccount } from '@common/interfaces/user';
import { Container } from 'typedi';

// These are the stubs for the accounts used in the default
// list of scores in a new card.
export const ACCOUNTS_STUBS: UserAccount[] = [
    {
        uid: '1',
        username: 'John1',
        email: 'john1@gmail.com',
    } as UserAccount,
    {
        uid: '2',
        username: 'John2',
        email: 'john2@gmail.com',
    } as UserAccount,
    {
        uid: '3',
        username: 'John3',
        email: 'john3@gmail.com',
    } as UserAccount,
];

// This function is called when the server starts,
// to make sure the fake accounts are created in the database
// if they don't exist yet.
(async () => {
    const databaseService = Container.get(DatabaseService);

    if (!databaseService.database) await databaseService.init();

    const userService = Container.get(UserService);

    ACCOUNTS_STUBS.forEach((account) => {
        userService.createUser(account);
    });
})();
