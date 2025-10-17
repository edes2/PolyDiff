import { DB_COLLECTION_USERS } from '@app/env';
import { DatabaseService } from '@app/services/storage/database.service';
import { UserAccount } from '@common/interfaces/user';
import { WithId } from 'mongodb';
import { Service } from 'typedi';

@Service()
export class UserService {
    constructor(private databaseService: DatabaseService) {}

    get collection() {
        return this.databaseService.database.collection(DB_COLLECTION_USERS);
    }

    async getUserById(uid: string): Promise<UserAccount | null> {
        try {
            return (await this.collection.findOne({ uid })) as UserAccount | null;
        } catch (error) {
            return null;
        }
    }
    // const cardInfos = await this.collection.find({}, { projection: { _id: 0 } }).toArray();

    async getTop20Users(): Promise<UserAccount[] | null> {
        try {
            const users = await this.collection
                .find({
                    $or: [{ wins: { $gte: 1 } }, { losses: { $gte: 1 } }],
                })
                .sort({ wins: -1 }) // Sort by 'wins' in descending order
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                .limit(20) // Limit the result to top 20
                .toArray();
            return users as WithId<UserAccount>[];
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async getUsernameById(uid: string): Promise<string | null> {
        return (await this.getUserById(uid))?.username ?? null;
    }

    async createUser(user: UserAccount): Promise<void> {
        await this.collection.findOneAndDelete({ uid: user.uid }); // Delete the user if it already exists
        this.collection.insertOne(user);
    }

    async isUsernameAvailable(username: string): Promise<boolean> {
        return (await this.collection.findOne({ username })) === null;
    }

    async updateLanguage(language: string, uid: string): Promise<boolean> {
        const result = await this.collection.updateOne({ uid }, { $set: { languagePreference: language } }, { upsert: true });
        return result.modifiedCount === 1 ? true : false;
    }

    async updateTheme(theme: string, uid: string): Promise<boolean> {
        const result = await this.collection.updateOne({ uid }, { $set: { themePreference: theme } }, { upsert: true });
        return result.modifiedCount === 1 ? true : false;
    }

    async updateUsername(username: string, uid: string): Promise<boolean> {
        if (!(await this.isUsernameAvailable(username))) return false;
        try {
            await this.collection.updateOne({ uid }, { $set: { username } });
            return true;
        } catch {
            return false;
        }
    }

    async addWin(uid: string): Promise<boolean> {
        try {
            await this.collection.updateOne(
                { uid },
                {
                    $inc: { wins: 1 },
                },
                { upsert: true }, // This option creates a new document if no document matches the query
            );
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async addLoss(uid: string): Promise<boolean> {
        console.log('add loss');

        try {
            await this.collection.updateOne(
                { uid },
                {
                    $inc: { losses: 1 },
                },
                { upsert: true }, // This option creates a new document if no document matches the query
            );
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async addConnection(uid: string): Promise<boolean> {
        const newConnection = { connectedAt: new Date() };
        const result = await this.collection.updateOne({ uid }, { $push: { connections: newConnection } }, { upsert: true });
        return result.modifiedCount === 1;
    }

    async addDisconnection(uid: string): Promise<boolean> {
        const newDisconnection = { disconnectedAt: new Date() };
        const result = await this.collection.updateOne({ uid }, { $push: { connections: newDisconnection } }, { upsert: true });
        return result.modifiedCount === 1;
    }

    async getConnections(uid: string) {
        const result = await this.collection.findOne(
            { uid },
            {
                projection: { connections: { $slice: -30 } }, // Retrieves the last 30 connections
            },
        );
        return result ? result.connections : [];
    }

    async getCurrentSounds(uid: string) {
        const document = await this.collection.findOne({ uid });
        return document ? { diffSound: document.diffSound, errorSound: document.errorSound } : undefined;
    }

    async saveSound(soundUrl: string, uid: string, soundType: string): Promise<boolean> {
        let result;
        if (soundType === 'diffSound') {
            result = await this.collection.updateOne({ uid }, { $set: { diffSound: soundUrl } }, { upsert: true });
        } else if (soundType === 'errorSound') {
            result = await this.collection.updateOne({ uid }, { $set: { errorSound: soundUrl } }, { upsert: true });
        }
        if (!result) return false;
        return result.modifiedCount === 1;
    }
}
