import Koa from 'koa';
import KoaRouter from 'koa-router';

const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;

export default class Router {
  public static readonly authCookieName = '_app_auth';

  protected instance: KoaRouter;
  protected allPathsWithMethods = new Map<string, string[]>();
  protected readonly sessionConfig = {
    key: '__app',
    maxAge: ONE_DAY_IN_MS,
    overwrite: true,
    signed: true,
    httpOnly: true,
  };

  protected constructor(
    prefix: string,
    { requiresAuth } = { requiresAuth: true }
  ) {
    this.instance = new KoaRouter({ prefix: `/api${prefix}` });

    this.instance.use(async (ctx, next) => {
      if (requiresAuth && !Router.is_authenticated(ctx)) {
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

    this.instance.stack.forEach(({ path, methods }) => {
      if (!path.endsWith(DYNAMIC_URL_SUFFIX))
        this.allPathsWithMethods.set(path, methods);
    });

    return new Map(this.allPathsWithMethods);
  }

  public static is_authenticated(ctx: Koa.ParameterizedContext) {
    return Boolean(ctx.cookies.get(Router.authCookieName));
  }
}
