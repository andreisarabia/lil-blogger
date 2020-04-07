import Koa from 'koa';

import Router from './Router';
import Article from '../models/Article';
import User from '../models/User';
import config from '../config';
import { sort_by_date, is_url } from '../util';

type ParseRequestOptions = {
  url: string;
};

export default class ArticleRouter extends Router {
  constructor() {
    super('/article');

    this.instance
      .get('/remove-all', (ctx) => this.reset_app(ctx))
      .get('/list', (ctx) => this.send_articles(ctx))
      .put('/save', (ctx) => this.save_article(ctx))
      .delete('/', (ctx) => this.delete_article(ctx))
      .delete('/all', (ctx) => this.delete_all_articles(ctx));
  }

  private async reset_app(ctx: Koa.ParameterizedContext): Promise<void> {
    if (!config.IS_DEV) return;

    try {
      await Promise.all([Article.delete_all(), User.delete_all()]);
    } catch (error) {
      console.error(error);
      ctx.body = error instanceof Error ? error.message : JSON.stringify(error);
    }
  }

  private async send_articles(ctx: Koa.ParameterizedContext): Promise<void> {
    const allArticles: Article[] | null = await Article.find_all({
      userId: (<User>ctx.session.user).id,
    });

    if (allArticles) {
      const articles = allArticles
        .sort((a, b) => sort_by_date(a.createdOn, b.createdOn))
        .map((article) => article.info);

      ctx.body = { articlesList: articles };
    } else {
      ctx.body = { articlesList: [] };
    }
  }

  private async save_article(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url } = <ParseRequestOptions>ctx.request.body;

    if (is_url(url)) {
      const user: User = ctx.session.user;

      let article = await Article.find({ userId: user.id });

      if (article) {
        await article.update({ canonicalUrl: url });
      } else {
        article = await Article.create(url, user);
      }

      ctx.body = { error: null, msg: 'ok', article: article.info };
    } else {
      ctx.status = 400;

      ctx.body = { error: 'Cannot parse given URL.', msg: null };
    }
  }

  private async delete_article(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url } = <ParseRequestOptions>ctx.request.body;
    const successfullyDeleted = await Article.delete(
      <User>ctx.session.user,
      url
    );

    if (successfullyDeleted) {
      ctx.body = { error: null, msg: 'ok' };
    } else {
      ctx.status = 400;

      ctx.body = { error: 'Could not delete the given URL.', msg: null };
    }
  }

  private async delete_all_articles(
    ctx: Koa.ParameterizedContext
  ): Promise<void> {
    try {
      await Article.delete_all();

      ctx.body = { error: null, msg: 'ok' };
    } catch (error) {
      let err: string;

      if (error instanceof Error) {
        if (error.stack) console.error(error.stack);

        err = config.IS_DEV
          ? `Error deleting all articles: ${error.message}`
          : 'fail';
      } else {
        err = 'fail';
      }

      ctx.body = { error: err, msg: '' };
    }
  }
}
