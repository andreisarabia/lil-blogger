import striptags from 'striptags';
import { JSDOM } from 'jsdom';
import Mercury, { ParseResult } from '@postlight/mercury-parser';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ObjectID } from 'mongodb';

import Model, { BaseProps } from './Model';
import User from './User';
import { sanitize, remove_extra_whitespace } from '../util';
import { ALLOWED_HTML_TAGS } from './constants';

export interface ArticleProps extends BaseProps, ParseResult {
  canonicalUrl: string;
  createdOn: string; // UTC
  uniqueId: string;
  slug: string;
  userId: ObjectID;
}

type ArticlePropsKey = keyof ArticleProps;

type ArticleUrlExtractionData = Omit<ArticleProps, 'uniqueId'>;

export default class Article extends Model {
  private static readonly collectionName = 'articles';

  protected constructor(protected props: ArticleProps) {
    super(props, Article.collectionName);
  }

  public get info(): Omit<ArticleProps, '_id' | 'userId'> {
    const { _id, userId, ...publicProps } = this.props;

    return publicProps;
  }

  private update_props<Key extends ArticlePropsKey>(
    key: Key,
    value: ArticleProps[Key]
  ) {
    this.props[key] = value;
  }

  public async update(propsToUpdate: Partial<ArticleProps>): Promise<void> {
    const keys = Object.keys(propsToUpdate) as ArticlePropsKey[];
    let updatedProps: { [key: string]: any } = {};

    for (const key of keys) {
      if (!(key in this.props)) continue;

      const value = propsToUpdate[key];

      if (value === undefined) continue;

      if (key === 'canonicalUrl') {
        // we want to get the original location's refreshed content
        const newProps = await Article.extract_url_data(value as string);

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

  public static async create({
    url,
    userId
  }: Pick<ArticleProps, 'url' | 'userId'>): Promise<Article> {
    const cleanData = await Article.extract_url_data(url);
    const uniqueId = uuidv4(); // client facing unique id, not Mongo's _id

    return new Article({ ...cleanData, uniqueId, userId });
  }

  public static async find(user: User): Promise<Article> {
    const articleData = (await Model.search({
      collection: Article.collectionName,
      criteria: { userId: user.id },
      limit: 1
    })) as ArticleProps;

    return articleData ? new Article(articleData) : null;
  }

  public static async find_all(
    searchProps: Partial<ArticleProps> = {}
  ): Promise<Article[]> {
    const data = (await Model.search({
      collection: Article.collectionName,
      criteria: searchProps,
      limit: 0
    })) as ArticleProps[];
    const articles = data
      ? data.map(articleData => new Article(articleData))
      : null;

    return articles;
  }

  public static async delete(url: string): Promise<boolean> {
    const wasRemoved = await Model.remove(Article.collectionName, {
      url
    });

    return wasRemoved;
  }

  public static delete_all(): Promise<boolean> {
    return Model.drop_all(Article.collectionName);
  }

  private static async extract_url_data(
    url: string
  ): Promise<ArticleUrlExtractionData> {
    const { data: dirtyHtml }: { data: string } = await axios.get(url);
    const html = sanitize(remove_extra_whitespace(dirtyHtml), {
      ADD_TAGS: ['link']
    });
    const { content, ...restOfResult }: ParseResult = await Mercury.parse(url, {
      html: Buffer.from(html, 'utf-8')
    });

    return {
      ...restOfResult,
      content: striptags(content, ALLOWED_HTML_TAGS),
      createdOn: new Date().toISOString(),
      canonicalUrl: Article.extract_canonical_url(html) || url,
      slug: Article.extract_slug(url)
    } as ArticleUrlExtractionData;
  }

  private static extract_canonical_url(html: string): string {
    const linkTags = new JSDOM(html).window.document.querySelectorAll('link');

    for (const tag of linkTags) if (tag.rel === 'canonical') return tag.href;

    return null;
  }

  private static extract_slug(url: string): string {
    const { pathname } = new URL(url); // easier to parse URLs with queries
    const lastPartOfUrl = pathname.substring(pathname.lastIndexOf('/'));

    return lastPartOfUrl;
  }
}
