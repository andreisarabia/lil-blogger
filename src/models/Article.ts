import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

import Model from './Model';
import User from './User';
import { extractUrlData, toUniqueArray } from '../util';

import { ArticleProps } from '../typings';

export default class Article extends Model<ArticleProps> {
  protected static readonly collectionName = 'articles';

  protected constructor(props: ArticleProps) {
    super(props, Article.collectionName);
  }

  public get id(): ObjectId {
    return <ObjectId>this.props._id;
  }

  public get tags(): string[] {
    return <string[]>this.props.tags;
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

  public get url(): string {
    return this.props.url;
  }

  public get canonicalUrl(): string {
    return this.props.canonicalUrl;
  }

  private shouldRefreshArticleData(): boolean {
    return this.url !== this.canonicalUrl;
  }

  public setCanonicalUrl(canonicalUrl: string): this {
    this.props.canonicalUrl = canonicalUrl;

    return this;
  }

  public addTags(newTags: string[]): this {
    this.props.tags = toUniqueArray([
      ...this.props.tags,
      ...newTags.map(tag => tag.trim()),
    ]).sort();

    return this;
  }

  public async update(): Promise<void> {
    if (this.shouldRefreshArticleData()) {
      const articleData = await extractUrlData(this.props.canonicalUrl);

      this.props = { ...this.props, ...articleData };
    }

    await Article.updateOne(
      Article.collectionName,
      { _id: this.id },
      this.props
    );
  }

  public static async create(url: string, user: User): Promise<Article> {
    const data = await extractUrlData(url);

    return new Article({
      ...data,
      userId: user.id,
      uniqueId: uuidv4(),
      tags: [],
    }).save();
  }

  public static async find(
    criteria: Partial<ArticleProps>
  ): Promise<Article | null> {
    const articleData = await super.searchOne({
      collection: this.collectionName,
      criteria,
    });

    return articleData ? new Article(articleData) : null;
  }

  public static async findAll(
    criteria: Partial<ArticleProps>
  ): Promise<Article[] | null> {
    const articlesData = await super.search({
      collection: this.collectionName,
      criteria,
    });

    return articlesData ? articlesData.map(data => new Article(data)) : null;
  }

  public static delete(user: User, url: string): Promise<boolean> {
    return super.remove(this.collectionName, { userId: user.id, url });
  }
}
