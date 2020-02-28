import KoaRouter from 'koa-router';

export default class Router {
  protected instance: KoaRouter;
  protected pathsMap = new Map<string, string[]>();

  protected constructor(prefix: string) {
    this.instance = new KoaRouter({ prefix: `/api${prefix}` });
  }

  public get middleware(): KoaRouter {
    return this.instance;
  }

  public get allPaths(): Map<string, string[]> {
    this.pathsMap.clear();
    this.instance.stack.forEach(layer => {
      this.pathsMap.set(layer.path, layer.methods);
    });

    return new Map(this.pathsMap);
  }
}
