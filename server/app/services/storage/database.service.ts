import { DB_NAME, DB_URL } from '@app/env';
import { Db, MongoClient } from 'mongodb';
import { Service } from 'typedi';

@Service()
export class DatabaseService {
    private db: Db;
    private client: MongoClient;
    private isInitialized = false;

    get database(): Db {
        return this.db;
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        try {
            const env = process.env.NODE_ENV || 'development';
            await this.connectToDB(DB_URL, env);
            // eslint-disable-next-line no-console
            console.log('Database connection successful !');
        } catch {
            // eslint-disable-next-line no-console
            console.error('Database connection failed !');
            process.exit(1);
        }
    }

    async connectToDB(uri: string, env: string): Promise<void> {
        try {
            this.client = new MongoClient(uri);
            await this.client.connect();
            const dbName = env === 'development' ? `${DB_NAME}_dev` : DB_NAME;
            this.db = this.client.db(dbName);
        } catch {
            throw new Error('Database connection error');
        }
    }

    async closeConnection(): Promise<void> {
        return this.client.close();
    }
}
