import KoaRouter from 'koa-router';

export default class Router {
  protected instance: KoaRouter;

  protected constructor(prefix: string) {
    this.instance = new KoaRouter({ prefix: `/api/${prefix}` });
  }

  public get middleware(): KoaRouter {
    return this.instance;
  }
}
