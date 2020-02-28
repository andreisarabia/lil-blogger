import striptags from 'striptags';
import { JSDOM } from 'jsdom';
import Mercury, { ParseResult } from '@postlight/mercury-parser';
import axios from 'axios';

import Model, { BaseProps } from './Model';
import { sanitize, remove_extra_whitespace } from '../util';
import { ALLOWED_HTML_TAGS } from './constants';

export interface ArticleProps extends BaseProps, ParseResult {
  canonicalUrl: string;
  createdOn: string; // UTC
}

type ArticlePropsKey = keyof ArticleProps;

const extract_canonical_url = (html: string): string => {
  const { window } = new JSDOM(html);
  const linkTags = window.document.querySelectorAll('link');

  for (const tag of linkTags) {
    if (tag.rel === 'canonical') return tag.href;
  }

  return null;
};

const parse_url_for_article_data = async (
  url: string
): Promise<ArticleProps> => {
  const { data: dirtyHtml }: { data: string } = await axios.get(url);
  const sanitizedHtml = sanitize(dirtyHtml, { ADD_TAGS: ['link'] });
  const canonicalUrl = extract_canonical_url(sanitizedHtml) || url;
  const html = remove_extra_whitespace(sanitizedHtml);
  const parsedData: ParseResult = await Mercury.parse(url, { html });

  parsedData.content = striptags(parsedData.content, ALLOWED_HTML_TAGS);

  const createdOn = new Date().toISOString();

  return { ...parsedData, createdOn, canonicalUrl } as ArticleProps;
};

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

  public async update(propsToUpdate: Partial<ArticleProps>) {
    for (const key of Object.keys(propsToUpdate) as ArticlePropsKey[]) {
      const updatedValue = propsToUpdate[key];

      if (updatedValue === undefined) continue;

      if (key === 'canonicalUrl') {
        const updatedProps = await parse_url_for_article_data(
          updatedValue as string
        );

        this.props = updatedProps;
        break;
      } else {
        this.update_props(key, updatedValue);
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
    const cleanData = await parse_url_for_article_data(url);

    return new Article(cleanData);
  }

  public static async find_all(): Promise<Article[]> {
    const data = (await Model.search({
      collection: Article.collectionName,
      criteria: {},
      limit: 0
    })) as ArticleProps[];
    const articles: Article[] = data.map(
      articleData => new Article(articleData)
    );

    return articles;
  }

  public static async delete(url: string): Promise<boolean> {
    const wasRemoved = await Model.remove(Article.collectionName, {
      url
    });

    return wasRemoved;
  }
}
