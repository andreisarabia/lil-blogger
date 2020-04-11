import { FilterQuery, ObjectID } from 'mongodb';

import Database from '../lib/Database';

import { BaseProps } from '../typings';

type SearchOptions = {
  collection: string;
  criteria: object;
  limit?: number;
};

export default class Model<T extends BaseProps> {
  protected static readonly collectionName: string;

  private db: Database;

  protected constructor(collection: string) {
    this.db = Database.instance(collection);
  }

  protected async insert<T extends BaseProps>(props: T): Promise<T> {
    const [error, results] = await this.db.insert({ ...props });

    if (results) return <T>{ ...results.ops[0] };
    else throw error;
  }

  protected static updateOne(
    collection: string,
    searchProps: object,
    propsToUpdate: object
  ): Promise<boolean> {
    return Database.instance(collection).updateOne(searchProps, {
      $set: propsToUpdate,
    });
  }

  protected static searchOne({
    collection,
    criteria,
  }: SearchOptions): Promise<object | null> {
    return Database.instance(collection).find(criteria, { limit: 1 });
  }

  protected static search({
    collection,
    criteria,
    limit,
  }: SearchOptions): Promise<object[] | null> {
    return <Promise<object[] | null>>(
      Database.instance(collection).find(criteria, { limit })
    );
  }

  protected static remove(
    collection: string,
    criteria: FilterQuery<object>
  ): Promise<boolean> {
    return Database.instance(collection).delete(criteria);
  }

  public static deleteAll(): Promise<boolean> {
    return Database.instance(this.collectionName).dropCollection();
  }
}
