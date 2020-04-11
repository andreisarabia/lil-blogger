import Koa from 'koa';

import Router from './Router';
import Article from '../models/Article';
import User from '../models/User';
import config from '../config';
import { sortByDate, isUrl } from '../util';

type ParseRequestOptions = {
  url: string;
};

export default class ArticleRouter extends Router {
  constructor() {
    super('/article');

    this.instance
      .get('/list', ctx => this.sendArticles(ctx))
      .put('/save', ctx => this.saveArticle(ctx))
      .delete('/', ctx => this.deleteArticle(ctx))
      .delete('/all', ctx => this.deleteAllArticles(ctx));
  }

  private async sendArticles(ctx: Koa.ParameterizedContext): Promise<void> {
    const allArticles: Article[] | null = await Article.findAll({
      userId: (<User>ctx.session.user).id,
    });

    if (allArticles) {
      const articles = allArticles
        .sort((a, b) => sortByDate(a.createdOn, b.createdOn))
        .map(article => article.info);

      ctx.body = { articlesList: articles };
    } else {
      ctx.body = { articlesList: [] };
    }
  }

  private async saveArticle(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url } = <ParseRequestOptions>ctx.request.body;

    if (isUrl(url)) {
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

  private async deleteArticle(ctx: Koa.ParameterizedContext): Promise<void> {
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

  private async deleteAllArticles(
    ctx: Koa.ParameterizedContext
  ): Promise<void> {
    try {
      await Article.deleteAll();

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
