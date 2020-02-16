import Database from '../lib/Database';

type SearchCriteria = {
  collection: string;
  criteria: object;
  limit?: number;
};

export default class Model {
  private db: Database;
  protected props: object;

  protected constructor(props = {}, collection: string) {
    this.props = { ...props };
    this.db = Database.instance(collection);
  }

  public get info() {
    return { ...this.props };
  }

  public async save(): Promise<this> {
    const [error, results] = await this.db.insert(this.props);
    if (error) throw error;

    const [props] = results.ops;
    this.props = props;
    return this;
  }

  public static async search({
    collection,
    criteria,
    limit
  }: SearchCriteria): Promise<object | object[]> {
    return Database.instance(collection).find(criteria, { limit });
  }
}
