import { v4 as uuidv4 } from 'uuid';

import Model from './Model';
import User from './User';
import { extract_url_data } from '../util/parser';

import { ArticleProps } from '../typings';

type ArticlePropsKey = keyof ArticleProps;

export default class Article extends Model {
  protected static readonly collectionName = 'articles';

  protected constructor(protected props: ArticleProps) {
    super(props, Article.collectionName);
  }

  public get info(): Omit<ArticleProps, '_id' | 'userId'> {
    const { _id, userId, ...publicProps } = this.props;

    return publicProps;
  }

  /**
   * Returns timestamp in UTC string
   */
  public get createdOn(): string {
    return this.props.createdOn;
  }

  private update_props<Key extends ArticlePropsKey>(
    key: Key,
    value: ArticleProps[Key]
  ) {
    this.props[key] = value;
  }

  public async update(propsToUpdate: Partial<ArticleProps>): Promise<void> {
    let updatedProps: { [key: string]: any } = {};

    for (const key of Object.keys(propsToUpdate) as ArticlePropsKey[]) {
      if (!(key in this.props)) continue;

      const value = propsToUpdate[key];

      if (value === undefined) continue;

      if (key === 'canonicalUrl') {
        // we want to get the original location's refreshed content
        const newProps = await extract_url_data(value as string);

        updatedProps = { ...updatedProps, ...newProps };
        this.props = { ...this.props, ...updatedProps };
        break;
      } else {
        this.update_props(key, value);
        updatedProps[key] = value;
      }
    }

    await Model.update_one(
      Article.collectionName,
      { _id: this.id },
      updatedProps
    );
  }

  public static async create(url: string, user: User): Promise<Article> {
    const cleanData = await extract_url_data(url);
    const uniqueId = uuidv4(); // client facing unique id, not Mongo's _id

    return new Article({ ...cleanData, uniqueId, userId: user.id });
  }

  public static async find(
    criteria: Partial<ArticleProps>
  ): Promise<Article | null> {
    const articleData = await super.search_one({
      collection: this.collectionName,
      criteria,
    });

    return articleData ? new Article(articleData as ArticleProps) : null;
  }

  public static async find_all(
    criteria: Partial<ArticleProps>
  ): Promise<Article[] | null> {
    const articlesData = await super.search({
      collection: this.collectionName,
      criteria,
      limit: 0,
    });

    return articlesData
      ? (articlesData as ArticleProps[]).map((data) => new Article(data))
      : null;
  }

  public static delete(user: User, url: string): Promise<boolean> {
    return super.remove(this.collectionName, { userId: user.id, url });
  }
}
