import Model from './Model';
import { remove_extra_whitespace } from '../util/validators';
import { ALLOWED_HTML_TAGS } from './constants';
import striptags from 'striptags';
import Mercury, { ParseResult } from '@postlight/mercury-parser';

export default class Article extends Model {
  private static readonly collectionName = 'articles';

  constructor(protected props: ParseResult | object) {
    super(props, Article.collectionName);
  }

  public static async find(url: string): Promise<Article> {
    let articleData = (await Model.search({
      collection: Article.collectionName,
      criteria: { url },
      limit: 1
    })) as ParseResult;

    if (!articleData) {
      articleData = await Mercury.parse(url);
      const cleanedContent = striptags(articleData.content, ALLOWED_HTML_TAGS);
      articleData.content = remove_extra_whitespace(cleanedContent);
    }

    return new Article(articleData);
  }

  public static async find_all(): Promise<Article[]> {
    const data = (await Model.search({
      collection: Article.collectionName,
      criteria: {},
      limit: 0
    })) as ParseResult[];

    const articles: Article[] = data.map(
      articleData => new Article(articleData)
    );

    return articles;
  }
}
