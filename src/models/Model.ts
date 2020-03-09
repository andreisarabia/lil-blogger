import { FilterQuery, ObjectID } from 'mongodb';

import Database, { InsertResult } from '../lib/Database';

type SearchOptions = {
  collection: string;
  criteria: object;
  limit?: number;
};

export interface BaseProps {
  _id?: ObjectID;
}

export default class Model {
  private db: Database;

  protected constructor(protected props: BaseProps, collection: string) {
    this.props = { ...props };
    this.db = Database.instance(collection);
  }

  public get id(): ObjectID {
    return this.props._id;
  }

  public async save(): Promise<this> {
    const [error, results] = await this.db.insert(this.props);
    if (error) throw error;

    const { _id, ...props } = results.ops[0] as InsertResult;
    this.props = props;

    return this;
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

  protected static drop_all(collection: string): Promise<boolean> {
    return Database.instance(collection).drop_collection();
  }

  protected static remove(
    collection: string,
    criteria: FilterQuery<object>
  ): Promise<boolean> {
    return Database.instance(collection).delete(criteria);
  }
}
