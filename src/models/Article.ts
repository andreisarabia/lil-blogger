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

const extract_canonical_url = (dom: JSDOM): string => {
  const linkTags = [...dom.window.document.querySelectorAll('link')];
  const canonicalLinkTag = linkTags.find(tag => tag.rel === 'canonical');
  return canonicalLinkTag ? canonicalLinkTag.href : null;
};

const parse_url_for_article_content = (url: string) => {};

export default class Article extends Model {
  private static readonly collectionName = 'articles';

  constructor(protected props: ArticleProps) {
    super(props, Article.collectionName);
  }

  public async update(propsToUpdate: Partial<ArticleProps>) {
    const { url, canonicalUrl, ...restOfPropsToUpdate } = propsToUpdate;

    for (const key in propsToUpdate) {
      if (key in this.props && this.props[key] !== propsToUpdate[key]) {
        this.props[key] = propsToUpdate[key];
      }
    }
  }

  public get info() {
    const dereferencedProps = { ...this.props };
    delete dereferencedProps._id;

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
    const { data: html }: { data: string } = await axios.get(url);
    const canonicalUrl = extract_canonical_url(new JSDOM(html));
    const {
      content,
      ...restOfArticleData
    }: ParseResult = await Mercury.parse(url, { html });
    const sanitizedContent = striptags(
      DOMPurify.sanitize(content),
      ALLOWED_HTML_TAGS
    );
    const cleanData: ArticleProps = {
      ...restOfArticleData,
      content: remove_extra_whitespace(sanitizedContent),
      canonicalUrl
    };

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
