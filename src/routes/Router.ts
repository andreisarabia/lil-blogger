import KoaRouter from 'koa-router';

export default class Router {
  public readonly sessionName?: string;
  protected instance: KoaRouter;
  protected allPathsWithMethods = new Map<string, string[]>();
  protected readonly sessionConfig = {
    key: '__app',
    maxAge: 100000,
    overwrite: true,
    signed: true,
    httpOnly: true,
    autoCommit: true
  };
  private readonly defaultApiHeader = { 'Content-Type': 'application/json' };

  protected constructor(prefix: string) {
    this.instance = new KoaRouter({ prefix: `/api${prefix}` });

    this.instance.use(async (ctx, next) => {
      ctx.set(this.defaultApiHeader);
      await next();
    });
  }

  public get middleware(): KoaRouter {
    return this.instance;
  }

  public get pathsMap(): Map<string, string[]> {
    const DYNAMIC_URL_SUFFIX = '.*'; // added by KoaRouter, no need to log it for path maps

    this.allPathsWithMethods.clear();

    this.instance.stack.forEach(({ path, methods }) => {
      if (!path.includes(DYNAMIC_URL_SUFFIX))
        this.allPathsWithMethods.set(path, methods);
    });

    return new Map(this.allPathsWithMethods);
  }
}
