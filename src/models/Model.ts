import { FilterQuery, ObjectID } from 'mongodb';

import Database from '../lib/Database';

import { BaseProps } from '../typings';

type SearchOptions<T> = {
  collection: string;
  criteria: Partial<T>;
  limit?: number;
};

export default abstract class Model<T extends BaseProps> {
  protected static readonly collectionName: string;

  private db: Database;

  abstract async update(props: Partial<T>): Promise<void>;

  protected constructor(protected props: T, collection: string) {
    this.db = Database.instance(collection);
  }

  protected updateProps<K extends keyof T>(key: K, value: T[K]): void {
    this.props[key] = value;
  }

  protected async save(): Promise<this> {
    const result = await this.db.insert({ ...this.props });

    this.props = <T>{ ...result };

    return this;
  }

  protected static updateOne<T>(
    collection: string,
    searchProps: Partial<T>,
    props: T
  ): Promise<boolean> {
    return Database.instance(collection).updateOne(searchProps, {
      $set: props,
    });
  }

  protected static searchOne<T>({
    collection,
    criteria,
  }: SearchOptions<T>): Promise<T | null> {
    return Database.instance(collection).findOne<T>(criteria, { limit: 1 });
  }

  protected static search<T>({
    collection,
    criteria,
    limit,
  }: SearchOptions<T>): Promise<T[] | null> {
    return Database.instance(collection).findAll<T>(criteria, { limit });
  }

  protected static remove<T>(
    collection: string,
    criteria: Partial<T>
  ): Promise<boolean> {
    return Database.instance(collection).delete(criteria);
  }

  public static deleteAll(): Promise<boolean> {
    return Database.instance(this.collectionName).dropCollection();
  }
}
