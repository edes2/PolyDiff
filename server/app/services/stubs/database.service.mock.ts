// Since the class is a mock, testing the branch else is trivial
/* istanbul ignore file  */
import { DB_NAME } from '@app/env';
import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Source : https://gitlab.com/nikolayradoev/mongodb-example

export class DatabaseServiceMock {
    mongoServer: MongoMemoryServer;

    database: Db;
    private client: MongoClient;

    async connectToDB(): Promise<MongoClient | null> {
        if (!this.client) {
            this.mongoServer = await MongoMemoryServer.create();
            this.client = new MongoClient(this.mongoServer.getUri());
            await this.client.connect();
            this.database = this.client.db(`${DB_NAME}_dev`);
        }
        return this.client;
    }

    async closeConnection(): Promise<void> {
        if (this.client) {
            return this.client.close();
        } else {
            return Promise.resolve();
        }
    }
}
