import { FilterQuery, ObjectID } from 'mongodb';

import Database, { InsertResult } from '../lib/Database';

type SearchCriteria = {
  collection: string;
  criteria: object;
  limit?: number;
};

export interface BaseProps {
  _id?: ObjectID;
}

export default class Model {
  private db: Database;
  protected props: BaseProps;

  protected constructor(props: BaseProps, collection: string) {
    this.props = { ...props };
    this.db = Database.instance(collection);
  }

  public async save(): Promise<this> {
    const [error, results] = await this.db.insert(this.props);
    if (error) throw error;

    const { _id, ...props } = results.ops[0] as InsertResult;
    this.props = props;

    return this;
  }

  protected static async search({
    collection,
    criteria,
    limit
  }: SearchCriteria): Promise<object | object[]> {
    return Database.instance(collection).find(criteria, { limit });
  }

  protected static async remove(
    collection: string,
    criteria: FilterQuery<object>
  ): Promise<boolean> {
    return Database.instance(collection).delete(criteria);
  }
}
