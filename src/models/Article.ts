import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

import Model from './Model';
import User from './User';
import { extractUrlData } from '../util/parser';

import { ArticleProps, ArticlePropsKey } from '../typings';

export default class Article extends Model<ArticleProps> {
  protected static readonly collectionName = 'articles';

  protected constructor(protected props: ArticleProps) {
    super(Article.collectionName);
  }

  public get id(): ObjectId {
    return <ObjectId>this.props._id;
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

  private updateProps<Key extends ArticlePropsKey>(
    key: Key,
    value: ArticleProps[Key]
  ) {
    this.props[key] = value;
  }

  private async save(): Promise<void> {
    this.props = await super.insert(this.props);
  }

  public async update(propsToUpdate: Partial<ArticleProps>): Promise<void> {
    let updatedProps: { [key: string]: any } = {};

    for (const key of <ArticlePropsKey[]>Object.keys(propsToUpdate)) {
      if (!(key in this.props)) continue;

      const value = propsToUpdate[key];

      if (value === undefined) continue;

      if (key === 'canonicalUrl') {
        // we want to get the original location's refreshed content
        const newProps = await extractUrlData(<string>value);

        updatedProps = { ...updatedProps, ...newProps };
        this.props = { ...this.props, ...updatedProps };
        break;
      } else {
        this.updateProps(key, value);
        updatedProps[key] = value;
      }
    }

    await Model.updateOne(
      Article.collectionName,
      { _id: this.id },
      updatedProps
    );
  }

  public static async create(url: string, user: User): Promise<Article> {
    const cleanData = await extractUrlData(url);
    const newArticle = new Article({
      ...cleanData,
      userId: user.id,
      uniqueId: uuidv4(),
    });

    await newArticle.save();

    return newArticle;
  }

  public static async find(
    criteria: Partial<ArticleProps>
  ): Promise<Article | null> {
    const articleData = await super.searchOne({
      collection: this.collectionName,
      criteria,
    });

    return articleData ? new Article(<ArticleProps>articleData) : null;
  }

  public static async findAll(
    criteria: Partial<ArticleProps>
  ): Promise<Article[] | null> {
    const articlesData = await super.search({
      collection: this.collectionName,
      criteria,
    });

    return articlesData
      ? (<ArticleProps[]>articlesData).map(data => new Article(data))
      : null;
  }

  public static delete(user: User, url: string): Promise<boolean> {
    return super.remove(this.collectionName, { userId: user.id, url });
  }
}
