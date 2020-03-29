import { FilterQuery, ObjectID } from 'mongodb';

import Database, { InsertResult } from '../lib/Database';

import { BaseProps } from '../typings';

type SearchOptions = {
  collection: string;
  criteria: object;
  limit?: number;
};

export default class Model {
  private db: Database;
  protected static readonly collectionName: string;

  protected constructor(protected props: BaseProps, collection: string) {
    this.props = { ...props };
    this.db = Database.instance(collection);
  }

  public get id(): ObjectID {
    return this.props._id;
  }

  public async save(): Promise<void> {
    const [error, results] = await this.db.insert(this.props);
    if (error) throw error;

    const { _id, ...props } = results.ops[0] as BaseProps;

    this.props = { ...this.props, ...props };
  }

  protected static update_one(
    collection: string,
    searchProps: object,
    propsToUpdate: object
  ): Promise<boolean> {
    return Database.instance(collection).update_one(searchProps, {
      $set: propsToUpdate
    });
  }

  protected static search({
    collection,
    criteria,
    limit
  }: SearchOptions): Promise<object | object[]> {
    return Database.instance(collection).find(criteria, { limit });
  }

  protected static remove(
    collection: string,
    criteria: FilterQuery<object>
  ): Promise<boolean> {
    return Database.instance(collection).delete(criteria);
  }

  public static delete_all(): Promise<boolean> {
    return Database.instance(this.collectionName).drop_collection();
  }
}
