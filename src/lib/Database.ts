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

/**
 * Each instance of a database is only created once, through the
 * static `instance` method.
 * An instance represents a connection to a collection.
 */
export default class Database {
  private static client: MongoClient = null;
  private static dbCache = new Map<string, Database>();

  private dbCollection: Collection;

  private constructor(collectionName: string) {
    this.dbCollection = Database.client.db().collection(collectionName);
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

  public async drop_collection(): Promise<boolean> {
    try {
      await this.dbCollection.drop();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
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

  public static instance(collection: string): Database {
    const cache = Database.dbCache;

    if (!cache.has(collection)) cache.set(collection, new Database(collection));

    return cache.get(collection);
  }
}
