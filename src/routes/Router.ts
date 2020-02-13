import KoaRouter from 'koa-router';

export default class Router {
  private instance: KoaRouter;

  protected constructor(prefix: string) {
    this.instance = new KoaRouter();
  }

  public get middleware(): KoaRouter {
    return this.instance;
  }
}
