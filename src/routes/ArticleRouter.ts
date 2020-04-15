import Koa from 'koa';

import Router from './Router';
import Article from '../models/Article';
import User from '../models/User';
import config from '../config';
import { sortByDate, isAlphanumericArray, isValidUuid, isUrl } from '../util';

type ParseRequestOptions = {
  url: string;
};

type AddTagsRequestOptions = {
  articleId: string;
  tags: string[];
};

const MAX_TAG_LENGTH = 20;

const areValidTagsRequestParams = (articleId: string, tags: string[]) =>
  isValidUuid(articleId) &&
  isAlphanumericArray(tags) &&
  tags.every(tag => tag.length <= MAX_TAG_LENGTH);

export default class ArticleRouter extends Router {
  constructor() {
    super('/article');

    this.instance
      .get('/list', ctx => this.sendArticles(ctx))
      .put('/save', ctx => this.saveArticle(ctx))
      .post('/add-tags', ctx => this.addTagsToArticle(ctx))
      .post('/search-articles', ctx => this.searchArticles(ctx))
      .delete('/', ctx => this.deleteArticle(ctx))
      .delete('/all', ctx => this.deleteAllArticles(ctx));
  }

  private async sendArticles(ctx: Koa.ParameterizedContext): Promise<void> {
    const user: User = ctx.session.user;
    const results = await Article.findAll({ userId: user.id });

    if (results) {
      const articles = results
        .sort((a, b) => sortByDate(a.createdOn, b.createdOn))
        .map(article => article.info);

      ctx.body = { articlesList: articles };
    } else {
      ctx.body = { articlesList: [] };
    }
  }

  private async saveArticle(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url }: ParseRequestOptions = ctx.request.body;

    if (isUrl(url)) {
      const user: User = ctx.session.user;

      let article = await Article.find({ userId: user.id, url });

      if (article) await article.setCanonicalUrl(url).update();
      else article = await Article.create(url, user);

      ctx.body = { error: null, msg: 'ok', article: article.info };
    } else {
      ctx.status = 400;

      ctx.body = { error: 'Cannot parse given URL.', msg: null };
    }
  }

  private async addTagsToArticle(ctx: Koa.ParameterizedContext): Promise<void> {
    const { articleId = '', tags }: AddTagsRequestOptions = ctx.request.body;

    if (areValidTagsRequestParams(articleId, tags)) {
      const user: User = ctx.session.user;
      const article = await Article.find({
        userId: user.id,
        uniqueId: articleId,
      });

      if (article) {
        await article.addTags(tags).update();

        ctx.body = { error: null, msg: 'ok', tags };

        return;
      }
    }

    ctx.status = 400;

    ctx.body = {
      error: 'Cannot apply given tags to the article.',
      msg: null,
    };
  }

  private async searchArticles(ctx: Koa.ParameterizedContext): Promise<void> {
    const { tag }: { tag: string } = ctx.request.body;
    const user: User = ctx.session.user;
    const results = await Article.findAll({ userId: user.id, tags: tag });

    if (results) {
      const articles = results.map(article => article.info);

      ctx.body = { error: null, msg: 'ok', articles };
    } else {
    }
  }

  private async deleteArticle(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url }: ParseRequestOptions = ctx.request.body;
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
