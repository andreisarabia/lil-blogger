import {
  Collection,
  FilterQuery,
  FindOneOptions,
  UpdateQuery,
  InsertOneWriteOpResult,
  InsertWriteOpResult,
  FindAndModifyWriteOpResultObject,
  UpdateWriteOpResult,
  MongoClient,
  ObjectId,
} from 'mongodb';

import { QueryResults, BaseProps } from '../typings';

/**
 * Each instance of a database is only created once, through the
 * static `instance` method.
 * An instance represents a connection to a collection.
 */
export default class Database {
  private static client: MongoClient | null = null;
  private static dbCache = new Map<string, Database>();

  private dbCollection: Collection;

  private constructor(private collection: string) {
    this.dbCollection = (<MongoClient>Database.client)
      .db()
      .collection(collection);
  }

  public async insert<T extends BaseProps>(
    dataObj: T
  ): Promise<[Error | null, QueryResults | null]> {
    try {
      const result = await this.dbCollection.insertOne(dataObj);

      return [
        null,
        <QueryResults>{ ops: (<InsertOneWriteOpResult<any>>result).ops },
      ];
    } catch (error) {
      return [error, null];
    }
  }

  public async find(
    criteria: FilterQuery<any>,
    options?: FindOneOptions
  ): Promise<object | object[] | any[] | null> {
    let results: object | object[] | any[] | null;

    if (options?.limit === 1) {
      results = await this.dbCollection.findOne(criteria);
    } else {
      results = await this.dbCollection.find(criteria, options).toArray();
    }

    return results;
  }

  public async updateOne(
    searchProps: object,
    props: UpdateQuery<any>
  ): Promise<boolean> {
    const result = await this.dbCollection.updateOne(searchProps, props);

    return (<UpdateWriteOpResult>result).result.ok === 1;
  }

  public async delete(criteria: FilterQuery<object>): Promise<boolean> {
    const result = await this.dbCollection.findOneAndDelete(criteria);

    return (<FindAndModifyWriteOpResultObject<any>>result).ok === 1;
  }

  public async dropCollection(): Promise<boolean> {
    try {
      await this.dbCollection.drop();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public static async initialize(): Promise<void> {
    if (Database.client) return;

    const mongoUri =
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/article_saver';

    Database.client = await MongoClient.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      poolSize: 20,
    });
  }

  public static instance(collection: string): Database {
    const cache = Database.dbCache;
    let db = cache.get(collection);

    if (!db) {
      db = new Database(collection);
      cache.set(collection, db);
    }

    return db;
  }
}
