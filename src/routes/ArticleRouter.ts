import Koa from 'koa';

import Router from './Router';
import Article from '../models/Article';
import { is_url } from '../util/fn';

type ParseRequestOptions = {
  url: string;
};

export default class ArticleRouter extends Router {
  constructor() {
    super('/article');

    this.instance
      .get('/list', ctx => this.send_articles(ctx))
      .put('/save', ctx => this.save_article(ctx))
      .delete('/', ctx => this.delete_article(ctx));
  }

  private async send_articles(ctx: Koa.ParameterizedContext): Promise<void> {
    const articles: Article[] = await Article.find_all();
    const articlesList = articles.map(article => article.info);

    ctx.body = { articlesList };
  }

  private async save_article(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url } = ctx.request.body as ParseRequestOptions;

    if (is_url(url)) {
      let article = await Article.find(url);

      if (article) {
        await article.update({ url, canonicalUrl: url });
      } else {
        article = await Article.create(url);
        await article.save();
      }

      ctx.body = { msg: 'ok', article: article.info };
    } else {
      ctx.status = 400;
      ctx.body = {
        msg: 'Cannot parse given URL.'
      };
    }
  }

  private async delete_article(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url } = ctx.request.body as ParseRequestOptions;
    const successfullyDeleted = await Article.delete(url);

    if (successfullyDeleted) {
      ctx.body = { msg: 'ok' };
    } else {
      ctx.status = 400;
      ctx.body = {
        msg: 'Could not delete the given URL.'
      };
    }
  }
}
