import {
  Collection,
  FilterQuery,
  FindOneOptions,
  InsertOneWriteOpResult,
  InsertWriteOpResult,
  MongoClient
} from 'mongodb';

export type QueryResults = {
  insertedId?: string;
  insertedCount?: number;
  ops?: object[];
};

export default class Database {
  private static dbClient: MongoClient;
  private static dbCache = new Map<string, Database>();

  private dbCollection: Collection;

  private constructor(collectionName: string) {
    this.dbCollection = Database.dbClient.db().collection(collectionName);
  }

  public static async initialize(): Promise<void> {
    if (!Database.dbClient) {
      const mongoUri =
        process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/article_saver';

      Database.dbClient = await MongoClient.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  }

  public static async shutdown_all_connections(): Promise<[Error, boolean]> {
    try {
      const client = await Database.dbClient;
      await client.close();
      return [null, true];
    } catch (error) {
      return [error, false];
    }
  }

  public async insert(
    dataObjs: object | object[]
  ): Promise<[Error, QueryResults]> {
    try {
      let result: InsertWriteOpResult<any> | InsertOneWriteOpResult<any> | any;

      if (Array.isArray(dataObjs)) {
        result = await this.dbCollection.insertMany(dataObjs as any[]);
      } else {
        result = await this.dbCollection.insertOne(dataObjs);
      }

      return [null, { ops: result.ops } as QueryResults];
    } catch (error) {
      return [error, null];
    }
  }

  public async find(
    criteria: FilterQuery<any>,
    options?: FindOneOptions
  ): Promise<object | object[] | any[]> {
    let results: object | object[] | any[];

    if (options && options.limit === 1) {
      results = await this.dbCollection.findOne(criteria);
    } else {
      results = await this.dbCollection.find(criteria, options).toArray();
    }

    return results;
  }

  public static instance(collectionName: string): Database {
    const cache = Database.dbCache;
    if (!cache.has(collectionName)) {
      const db = new Database(collectionName);
      cache.set(collectionName, db);
    }
    return cache.get(collectionName);
  }
}
