import striptags from 'striptags';
import Mercury, { ParseResult } from '@postlight/mercury-parser';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ObjectID } from 'mongodb';

import Model, { BaseProps } from './Model';
import User from './User';
import { extract_slug, extract_canonical_url } from '../util/url';
import { sanitize } from '../util/sanitizers';
import { ALLOWED_HTML_TAGS } from './constants';

export interface ArticleProps extends BaseProps, ParseResult {
  canonicalUrl: string;
  createdOn: string; // UTC
  uniqueId: string;
  slug: string;
  userId: ObjectID;
}

type ArticlePropsKey = keyof ArticleProps;

type ParsedArticleResult = Omit<ArticleProps, 'uniqueId'>;

const extract_url_data = async (url: string): Promise<ParsedArticleResult> => {
  const { data: dirtyHtml }: { data: string } = await axios.get(url);
  const html = sanitize(dirtyHtml, { ADD_TAGS: ['link'] });
  const parsedResult: ParseResult = await Mercury.parse(url, {
    html: Buffer.from(html, 'utf-8')
  });
  parsedResult.content = striptags(parsedResult.content, ALLOWED_HTML_TAGS);

  const createdOn = new Date().toISOString();
  const canonicalUrl = extract_canonical_url(html) || url;
  const slug = extract_slug(url);

  return {
    ...parsedResult,
    createdOn,
    canonicalUrl,
    slug
  } as ParsedArticleResult;
};

export default class Article extends Model {
  protected static readonly collectionName = 'articles';

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

  public static async find(criteria: Partial<ArticleProps>): Promise<Article> {
    const articleData = (await Model.search({
      collection: Article.collectionName,
      criteria: criteria,
      limit: 1
    })) as ArticleProps;

    return articleData ? new Article(articleData) : null;
  }

  public static async find_all(
    searchProps: Partial<ArticleProps> = {}
  ): Promise<Article[]> {
    const articlesData = (await Model.search({
      collection: Article.collectionName,
      criteria: searchProps,
      limit: 0
    })) as ArticleProps[];

    return articlesData ? articlesData.map(data => new Article(data)) : [];
  }

  public static delete(user: User, url: string): Promise<boolean> {
    return Model.remove(Article.collectionName, { userId: user.id, url });
  }
}
