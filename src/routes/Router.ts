import KoaRouter from 'koa-router';

const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;

export default class Router {
  public readonly sessionName?: string;
  protected instance: KoaRouter;
  protected allPathsWithMethods = new Map<string, string[]>();
  protected readonly sessionConfig = {
    key: '__app',
    maxAge: ONE_DAY_IN_MS,
    overwrite: true,
    signed: true,
    httpOnly: true,
    autoCommit: true
  };

  protected constructor(prefix: string) {
    this.instance = new KoaRouter({ prefix: `/api${prefix}` });

    const defaultApiHeader = { 'Content-Type': 'application/json' };

    this.instance.use(async (ctx, next) => {
      ctx.set(defaultApiHeader);
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
}
