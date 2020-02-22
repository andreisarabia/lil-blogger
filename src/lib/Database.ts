import {
  Collection,
  FilterQuery,
  FindOneOptions,
  InsertOneWriteOpResult,
  InsertWriteOpResult,
  FindAndModifyWriteOpResultObject,
  MongoClient,
  ObjectId
} from 'mongodb';

export type InsertResult = {
  _id: ObjectId;
};

export type QueryResults = {
  insertedId?: string;
  insertedCount?: number;
  ops?: object[];
};

export default class Database {
  private static client: MongoClient = null;
  private static dbCache = new Map<string, Database>();

  private dbCollection: Collection;

  private constructor(collectionName: string) {
    this.dbCollection = Database.client.db().collection(collectionName);
  }

  public static async initialize(): Promise<void> {
    if (!Database.client) {
      const mongoUri =
        process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/article_saver';

      Database.client = await MongoClient.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  }

  public static async shutdown_all_connections(): Promise<[Error, boolean]> {
    try {
      if (!Database.client) return [null, true];
      await Database.client.close();
      Database.client = null;

      return [null, true];
    } catch (error) {
      return [error, false];
    }
  }

  public static instance(collection: string): Database {
    const cache = Database.dbCache;
    if (!cache.has(collection)) {
      const db = new Database(collection);
      cache.set(collection, db);
    }

    return cache.get(collection);
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

    if (options?.limit === 1) {
      results = await this.dbCollection.findOne(criteria);
    } else {
      results = await this.dbCollection.find(criteria, options).toArray();
    }

    return results;
  }

  public async delete(criteria: FilterQuery<object>): Promise<boolean> {
    const result: FindAndModifyWriteOpResultObject<any> = await this.dbCollection.findOneAndDelete(
      criteria
    );

    return result.ok === 1;
  }
}
