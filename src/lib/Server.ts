import Koa from 'koa';
import koaBody from 'koa-body';
import nextApp from 'next';

import Database from '../lib/Database';
import routers from '../routes/routers';

const IS_DEV = process.env.NODE_ENV !== 'production';

let singleton: Server = null;

export default class Server {
  private apiApp = new Koa();
  private clientApp = nextApp({ dir: './client', dev: IS_DEV });
  private appPort = +process.env.APP_PORT || 3000;

  private constructor() {}

  private async initialize_client_app(): Promise<void> {
    console.time('client-app-startup-time');
    await this.clientApp.prepare();
    console.timeEnd('client-app-startup-time');
  }

  private async initialize_database(): Promise<void> {
    console.time('db-startup-time');
    await Database.initialize();
    console.timeEnd('db-startup-time');
  }

  public async start() {
    const clientAppHandler = this.clientApp.getRequestHandler();

    await Promise.all([
      this.initialize_client_app(),
      this.initialize_database()
    ]);

    this.apiApp.use(koaBody({ json: true }));

    this.apiApp.use(async (ctx, next) => {
      const start = Date.now();
      try {
        await next();
      } catch (error) {
        throw error;
      } finally {
        const xResponseTime = `${Date.now() - start}ms`;

        console.log(
          `${ctx.method} ${ctx.path} (${ctx.status}) - ${xResponseTime}`
        );

        if (IS_DEV) {
          ctx.set('X-Response-Time', xResponseTime);
        }
      }
    });

    routers.forEach(router => {
      console.log(router.allPaths);
      this.apiApp.use(router.middleware.routes());
      this.apiApp.use(router.middleware.allowedMethods());
    });

    this.apiApp.use(async ctx => {
      await clientAppHandler(ctx.req, ctx.res);
      ctx.respond = false;
    });

    this.apiApp.listen(this.appPort, () => {
      console.log(`Listening on port ${this.appPort}...`);
    });
  }

  public static get instance() {
    singleton = singleton || new Server();
    return singleton;
  }
}
