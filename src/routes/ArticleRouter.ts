import Router from './Router';
import Article from '../models/Article';
import { is_url } from '../util/fn';
import Koa from 'koa';

type ParseRequestOptions = {
  url: string;
};

export default class ArticleRouter extends Router {
  constructor() {
    super('/article');

    this.instance
      .get('/list', ctx => this.send_articles(ctx))
      .post('/save', ctx => this.save_article(ctx));
  }

  private async send_articles(ctx: Koa.ParameterizedContext): Promise<void> {
    const articles: Article[] = await Article.find_all();
    const articlesData = articles.map(article => article.info);

    ctx.body = { articlesData };
  }

  private async save_article(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url } = ctx.request.body as ParseRequestOptions;

    ctx.assert(is_url(url), 400, 'Cannot parse the given URL.');

    const article = await Article.find(url);
    await article.save();

    ctx.body = { msg: 'ok' };
  }
}
