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

export type InsertResult = {
  _id: ObjectId;
};

export type QueryResults = {
  _id?: ObjectId;
  insertedId?: string;
  insertedCount?: number;
  ops: object[];
};

/**
 * Each instance of a database is only created once, through the
 * static `instance` method.
 * An instance represents a connection to a collection.
 */
export default class Database {
  private static client: MongoClient | null = null;
  private static dbCache = new Map<string, Database>();

  private dbCollection: Collection;

  private constructor(collectionName: string) {
    this.dbCollection = (Database.client as MongoClient)
      .db()
      .collection(collectionName);
  }

  public async insert(
    dataObjs: object | object[]
  ): Promise<[Error | null, QueryResults | null]> {
    try {
      let result: InsertWriteOpResult<any> | InsertOneWriteOpResult<any>;

      if (Array.isArray(dataObjs)) {
        result = await this.dbCollection.insertMany(dataObjs);
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
  ): Promise<object | object[] | any[] | null> {
    let results: object | object[] | any[] | null;

    if (options?.limit === 1) {
      results = await this.dbCollection.findOne(criteria);
    } else {
      results = await this.dbCollection.find(criteria, options).toArray();
    }

    return results;
  }

  public async update_one(
    searchProps: object,
    props: UpdateQuery<any>
  ): Promise<boolean> {
    const result = await this.dbCollection.updateOne(searchProps, props);

    return (result as UpdateWriteOpResult).result.ok === 1;
  }

  public async delete(criteria: FilterQuery<object>): Promise<boolean> {
    const result = await this.dbCollection.findOneAndDelete(criteria);

    return (result as FindAndModifyWriteOpResultObject<any>).ok === 1;
  }

  public async drop_collection(): Promise<boolean> {
    try {
      await this.dbCollection.drop();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public static async initialize(): Promise<void> {
    if (!Database.client) {
      const mongoUri =
        process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/article_saver';

      Database.client = await MongoClient.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
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
