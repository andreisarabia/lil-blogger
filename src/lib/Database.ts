import {
  Collection,
  FilterQuery,
  FindOneOptions,
  UpdateQuery,
  InsertOneWriteOpResult,
  FindAndModifyWriteOpResultObject,
  UpdateWriteOpResult,
  MongoClient,
} from 'mongodb';

/**
 * Each instance of a database is only created once, through the
 * static `instance` method.
 * An instance represents a connection to a collection.
 */
export default class Database {
  private static client: MongoClient | null = null;
  private static dbCache = new Map<string, Database>();

  private dbCollection: Collection;

  private constructor(collection: string) {
    this.dbCollection = (<MongoClient>Database.client)
      .db()
      .collection(collection);
  }

  public async insert<T>(dataObj: T): Promise<T | null> {
    const result: InsertOneWriteOpResult<any> = await this.dbCollection.insertOne(
      dataObj
    );

    return <T>result.ops[0];
  }

  public findOne<T>(
    criteria: FilterQuery<Partial<T>>,
    options?: FindOneOptions
  ): Promise<T | null> {
    return this.dbCollection.findOne(criteria, options);
  }

  public async findAll<T>(
    criteria: FilterQuery<Partial<T>>,
    options?: FindOneOptions
  ): Promise<T[] | null> {
    const results = await this.dbCollection.find(criteria, options).toArray();

    return results.length > 0 ? results : null;
  }

  public async updateOne(
    searchProps: object,
    props: UpdateQuery<any>
  ): Promise<boolean> {
    const { result }: UpdateWriteOpResult = await this.dbCollection.updateOne(
      searchProps,
      props
    );

    return result.ok === 1;
  }

  public async delete(criteria: FilterQuery<object>): Promise<boolean> {
    const result: FindAndModifyWriteOpResultObject<any> = await this.dbCollection.findOneAndDelete(
      criteria
    );

    return result.ok === 1;
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
