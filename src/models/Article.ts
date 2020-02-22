import striptags from 'striptags';
import Mercury, { ParseResult } from '@postlight/mercury-parser';

import Model, { BaseProps } from './Model';
import { remove_extra_whitespace } from '../util/validators';
import { ALLOWED_HTML_TAGS } from './constants';

interface ArticleProps extends BaseProps, ParseResult {}

export default class Article extends Model {
  private static readonly collectionName = 'articles';

  constructor(protected props: ArticleProps) {
    super(props, Article.collectionName);
  }

  public get info() {
    const dereferencedProps = { ...this.props };
    delete dereferencedProps._id;

    return dereferencedProps;
  }

  public static async find(url: string): Promise<Article> {
    const articleData = (await Model.search({
      collection: Article.collectionName,
      criteria: { url },
      limit: 1
    })) as ArticleProps;

    return articleData ? new Article(articleData) : null;
  }

  public static async create(url: string): Promise<Article> {
    const { content, ...restOfArticleData }: ParseResult = await Mercury.parse(
      url
    );
    const cleanedContent = remove_extra_whitespace(
      striptags(content, ALLOWED_HTML_TAGS)
    );
    const cleanData = { ...restOfArticleData, content: cleanedContent };

    return new Article(cleanData as ArticleProps);
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

  public static async exists(url: string): Promise<boolean> {
    const article = await Article.find(url);

    return Boolean(article);
  }

  public static async delete(url: string): Promise<boolean> {
    const wasRemoved = await Model.remove(Article.collectionName, {
      url
    });

    return wasRemoved;
  }
}
