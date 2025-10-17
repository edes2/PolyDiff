/* eslint-disable import/no-named-as-default-member */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { DB_NAME } from '@app/env';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import sinon, { SinonStub } from 'sinon';
import { DatabaseService } from '@app/services/storage/database.service';
chai.use(chaiAsPromised); // this allows us to test for rejection

// Source : https://gitlab.com/nikolayradoev/mongodb-example

describe('Database service', () => {
    let databaseService: DatabaseService;
    let mongoServer: MongoMemoryServer;

    beforeEach(async () => {
        databaseService = new DatabaseService();
        mongoServer = await MongoMemoryServer.create();
    });

    afterEach(async () => {
        if (databaseService['client']) {
            await databaseService.closeConnection();
        }
    });

    it('getter database should return the db', async () => {
        expect(databaseService.database).to.equal(databaseService['db']);
    });

    // We do not test the case when DATABASE_URL is used in order to not connect to the real database
    it('should connect to the database when start is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.connectToDB(mongoUri, 'development');
        expect(databaseService['client']).to.not.be.undefined;
        expect(databaseService['db'].databaseName).to.equal(`${DB_NAME}_dev`);
    });

    it('should connect to the database when start is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.connectToDB(mongoUri, 'production');
        expect(databaseService['client']).to.not.be.undefined;
        expect(databaseService['db'].databaseName).to.equal(DB_NAME);
    });

    it('should not connect to the database when start is called with wrong URL', async () => {
        try {
            await databaseService.connectToDB('WRONG URL', 'development');
            expect(false).to.be.true; // To fail if no error thrown
        } catch (e) {
            expect(databaseService['client']).to.be.undefined;
        }
    });

    it('closeConnection should call MongoClient attribute close method', async () => {
        databaseService['client'] = { close: () => {} } as MongoClient;
        const closeMongoClientStub: SinonStub = sinon.stub(databaseService['client'], 'close').callsFake(async () => {});
        databaseService.closeConnection();
        expect(closeMongoClientStub.calledOnce).to.be.true;
    });
});
