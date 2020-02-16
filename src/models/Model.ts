import Database from '../lib/Database';

type SearchCriteria = {
  collection: string;
  criteria: object;
  limit: number;
};

export default class Model {
  private db: Database;
  protected props: object;

  protected constructor(props = {}, collection: string) {
    this.props = { ...props };
    this.db = Database.instance(collection);
  }

  protected async save(): Promise<this> {
    const [error, results] = await this.db.insert(this.props);

    if (error) throw error;

    this.props = { ...results };

    return this;
  }

  public static async search({
    collection,
    criteria,
    limit = 1
  }: SearchCriteria): Promise<object | object[]> {
    return Database.instance(collection).find(criteria, { limit });
  }
}
