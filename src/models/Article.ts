import striptags from 'striptags';
import { JSDOM } from 'jsdom';
import Mercury, { ParseResult } from '@postlight/mercury-parser';
import axios from 'axios';
import { v5 as uuidv5 } from 'uuid';

import Model, { BaseProps } from './Model';
import { sanitize, remove_extra_whitespace } from '../util';
import { ALLOWED_HTML_TAGS } from './constants';

export interface ArticleProps extends BaseProps, ParseResult {
  canonicalUrl: string;
  createdOn: string; // UTC
  uniqueId: string;
  slug: string;
}

type ArticlePropsKey = keyof ArticleProps;

export default class Article extends Model {
  private static readonly collectionName = 'articles';

  constructor(protected props: ArticleProps) {
    super(props, Article.collectionName);
  }

  private update_props<Key extends keyof ArticleProps>(
    key: Key,
    value: ArticleProps[Key]
  ) {
    this.props[key] = value;
  }

  public async update(propsToUpdate: Partial<ArticleProps>): Promise<void> {
    for (const key of Object.keys(propsToUpdate) as ArticlePropsKey[]) {
      if (propsToUpdate[key] === undefined) continue;
      if (!(key in this.props)) continue;

      if (key === 'canonicalUrl') {
        // we want to get the original location's refreshed content
        this.props = await Article.extract_url_data(propsToUpdate[key]);
        break;
      } else {
        this.update_props(key, propsToUpdate[key]);
      }
    }

    await this.save();
  }

  public get info(): Omit<ArticleProps, '_id'> {
    const dereferencedProps = { ...this.props };

    Reflect.deleteProperty(dereferencedProps, '_id');

    return dereferencedProps;
  }

  public static async find(url: string): Promise<Article> {
    const articleData = (await Model.search({
      collection: Article.collectionName,
      criteria: { url, canonicalUrl: url },
      limit: 1
    })) as ArticleProps;

    return articleData ? new Article(articleData) : null;
  }

  public static async create(url: string): Promise<Article> {
    const cleanData = await Article.extract_url_data(url);

    return new Article(cleanData);
  }

  public static async find_all(): Promise<Article[]> {
    const data = (await Model.search({
      collection: Article.collectionName,
      criteria: {},
      limit: 0
    })) as ArticleProps[];

    return data ? data.map(articleData => new Article(articleData)) : null;
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

  private static async extract_url_data(url: string): Promise<ArticleProps> {
    const { data: dirtyHtml }: { data: string } = await axios.get(url);
    const html = sanitize(remove_extra_whitespace(dirtyHtml), {
      ADD_TAGS: ['link']
    });
    const parsedData: ParseResult = await Mercury.parse(url, {
      html: Buffer.from(html, 'utf-8')
    });

    parsedData.content = striptags(parsedData.content, ALLOWED_HTML_TAGS);

    const canonicalUrl = Article.extract_canonical_url(html) || url;
    const createdOn = new Date().toISOString();
    const uniqueId = uuidv5(url, uuidv5.URL); // client facing unique id, not Mongo's _id
    const slug = Article.extract_slug(url);

    return {
      ...parsedData,
      createdOn,
      canonicalUrl,
      uniqueId,
      slug
    } as ArticleProps;
  }

  private static extract_canonical_url(html: string): string {
    const linkTags = new JSDOM(html).window.document.querySelectorAll('link');

    for (const tag of linkTags) {
      if (tag.rel === 'canonical') return tag.href;
    }

    return null;
  }

  private static extract_slug(url: string): string {
    const { pathname } = new URL(url);
    const lastPartOfUrl = pathname.substring(pathname.lastIndexOf('/'));

    return lastPartOfUrl;
  }
}
