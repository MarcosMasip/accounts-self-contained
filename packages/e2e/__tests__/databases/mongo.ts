import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { type DatabaseInterface } from '@accounts/types';
// TODO rename to AccountsMongo ?
import { Mongo } from '@accounts/mongo';
import { type DatabaseTestInterface } from './index';
import { createAccountsMongoModule } from '@accounts/module-mongo';

const defaultConnectionString = 'mongodb://localhost/accounts-js-tests-e2e';

export class DatabaseTest implements DatabaseTestInterface {
  public databaseModule = createAccountsMongoModule({ dbConn: mongoose.connection });
  public accountsDatabase: DatabaseInterface;
  private mongoServer?: MongoMemoryServer;

  constructor() {
    this.accountsDatabase = new Mongo(mongoose.connection);
  }

  public async start() {
    (mongoose as any).Promise = global.Promise;
    const useMemory = process.env.MONGO_INMEMORY === '1';
    if (useMemory) {
      this.mongoServer = await MongoMemoryServer.create();
      const uri = this.mongoServer.getUri();
      await mongoose.connect(uri);
    } else {
      const uri = process.env.MONGO_URL || defaultConnectionString;
      await mongoose.connect(uri);
    }
    try {
      await mongoose.connection.dropDatabase();
    } catch (_) {
      // ok if not supported by memory server yet
    }
  }

  public async stop() {
    await mongoose.connection.close();
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
  }
}
