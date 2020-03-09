import Koa from 'koa';

import { Router } from './Router';
import Article from '../models/Article';
import User from '../models/User';
import config from '../config';
import { sort_by_date, is_url } from '../util';

type ParseRequestOptions = {
  url: string;
};

export class ArticleRouter extends Router {
  constructor() {
    super('/article');

    this.instance
      .get('/list', ctx => this.send_articles(ctx))
      .put('/save', ctx => this.save_article(ctx))
      .delete('/', ctx => this.delete_article(ctx))
      .delete('/all', ctx => this.delete_all_articles(ctx));
  }

  private async send_articles(ctx: Koa.ParameterizedContext): Promise<void> {
    const user: User = ctx.session.user;
    const articles: Article[] = await Article.find_all({ userId: user.id });
    const articlesList = articles
      ? articles
          .map(article => article.info)
          .sort((a, b) => sort_by_date(a.createdOn, b.createdOn))
      : [];

    ctx.body = { articlesList };
  }

  private async save_article(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url } = ctx.request.body as ParseRequestOptions;

    if (is_url(url)) {
      const user: User = ctx.session.user;

      let article = await Article.find(user);

      if (article) {
        await article.update({ url, canonicalUrl: url });
      } else {
        const user: User = ctx.session.user;
        article = await Article.create({ url, userId: user.id });

        await article.save();
      }

      ctx.body = { msg: 'ok', article: article.info };
    } else {
      ctx.status = 400;

      ctx.body = { msg: 'Cannot parse given URL.' };
    }
  }

  private async delete_article(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url } = ctx.request.body as ParseRequestOptions;
    const successfullyDeleted = await Article.delete(url);

    if (successfullyDeleted) {
      ctx.body = { msg: 'ok' };
    } else {
      ctx.status = 400;

      ctx.body = { msg: 'Could not delete the given URL.' };
    }
  }

  private async delete_all_articles(
    ctx: Koa.ParameterizedContext
  ): Promise<void> {
    try {
      await Article.delete_all();

      ctx.body = { msg: 'ok' };
    } catch (error) {
      let msg: string;

      if (error instanceof Error) {
        if (error.stack) console.error(error.stack);

        msg = config.IS_DEV
          ? `Error deleting all articles: ${error.message}`
          : 'fail';
      } else {
        msg = 'fail';
      }

      ctx.body = { msg };
    }
  }
}
