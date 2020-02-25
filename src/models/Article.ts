import DOMPurify from 'dompurify';
import striptags from 'striptags';
import { JSDOM } from 'jsdom';
import Mercury, { ParseResult } from '@postlight/mercury-parser';
import axios from 'axios';

import Model, { BaseProps } from './Model';
import { remove_extra_whitespace } from '../util/validators';
import { ALLOWED_HTML_TAGS } from './constants';

export interface ArticleProps extends BaseProps, ParseResult {
  canonicalUrl: string;
}

type ArticlePropsKey = keyof ArticleProps;

const extract_canonical_url = (dom: JSDOM): string => {
  const linkTags = [...dom.window.document.querySelectorAll('link')];
  const canonicalLinkTag = linkTags.find(tag => tag.rel === 'canonical');

  return canonicalLinkTag ? canonicalLinkTag.href : null;
};

const parse_url_for_article_content = async (
  url: string
): Promise<ArticleProps> => {
  const { data: html }: { data: string } = await axios.get(url);
  const canonicalUrl = extract_canonical_url(new JSDOM(html));
  const parsedData: ParseResult = await Mercury.parse(url, {
    html: remove_extra_whitespace(DOMPurify.sanitize(html))
  });

  parsedData.content = striptags(parsedData.content, ALLOWED_HTML_TAGS);

  return { ...parsedData, canonicalUrl } as ArticleProps;
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
      if (updatedValue !== undefined) this.update_props(key, updatedValue);
    }
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
    const cleanData = await parse_url_for_article_content(url);

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
