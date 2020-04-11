import Koa from 'koa';
import KoaRouter from 'koa-router';

export default class Router {
  public static readonly authCookieName = '_app_auth';

  protected instance: KoaRouter;
  protected allPathsWithMethods = new Map<string, string[]>();

  protected constructor(
    prefix: string,
    { requiresAuth } = { requiresAuth: true }
  ) {
    this.instance = new KoaRouter({ prefix: `/api${prefix}` });

    this.instance.use(async (ctx, next) => {
      if (requiresAuth && !Router.isAuthenticated(ctx)) {
        ctx.throw(400, 'Not allowed.');
      }

      ctx.set({ 'Content-Type': 'application/json' });

      await next();
    });
  }

  public get middleware(): KoaRouter {
    return this.instance;
  }

  public get pathsMap(): Map<string, string[]> {
    const DYNAMIC_URL_SUFFIX = '(.*)'; // regex identifier added by KoaRouter, no need to log it

    this.allPathsWithMethods.clear();

    for (const { path, methods } of this.instance.stack) {
      if (path.endsWith(DYNAMIC_URL_SUFFIX)) continue;
      this.allPathsWithMethods.set(path, methods);
    }

    return new Map(this.allPathsWithMethods);
  }

  public static isAuthenticated(ctx: Koa.ParameterizedContext) {
    return Boolean(ctx.cookies.get(this.authCookieName));
  }
}
