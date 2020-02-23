import Koa from 'koa';
import koaBody from 'koa-body';
import nextApp from 'next';

import Database from '../lib/Database';
import routers from '../routes/routers';
import { is_url } from '../util/fn';

type ContentSecurityPolicy = {
  [k: string]: string[];
};

const IS_DEV = process.env.NODE_ENV !== 'production';

let singleton: Server = null;

export default class Server {
  private apiApp = new Koa();
  private clientApp = nextApp({ dir: './client', dev: IS_DEV });
  private appPort = +process.env.APP_PORT || 3000;
  private csp: ContentSecurityPolicy = {
    'default-src': ['self'],
    'script-src': ['self', 'unsafe-inline'],
    'style-src': ['self', 'unsafe-inline'],
    'connect-src': ['self']
  };

  private constructor() {}

  private get cspHeader(): string {
    let header = '';

    for (const [src, directives] of Object.entries(this.csp)) {
      const preppedDirectives = directives.map(directive =>
        is_url(directive) ? directive : `'${directive}'`
      );

      if (IS_DEV) preppedDirectives.push('http://localhost');

      const directiveRule = `${src} ${preppedDirectives.join(' ')}`;

      header += header === '' ? `${directiveRule}` : `; ${directiveRule}`;
    }

    return header;
  }

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

  public async start(): Promise<void> {
    const clientAppHandler = this.clientApp.getRequestHandler();
    const defaultClientHeaders = {
      'Content-Security-Policy': this.cspHeader
    };
    const defaultApiHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'deny',
      'X-XSS-Protection': '1; mode=block'
    };

    await Promise.all([
      this.initialize_client_app(),
      this.initialize_database()
    ]);

    this.apiApp.use(koaBody({ json: true }));

    this.apiApp.use(async (ctx, next) => {
      const start = Date.now();

      ctx.set(defaultApiHeaders);

      try {
        await next();
      } catch (error) {
        throw error;
      } finally {
        const xResponseTime = `${Date.now() - start}ms`;

        console.log(
          `${ctx.method} ${ctx.path} (${ctx.status}) - ${xResponseTime}`
        );

        if (IS_DEV) ctx.set('X-Response-Time', xResponseTime);
      }
    });

    routers.forEach(router => {
      console.log(router.allPaths);
      this.apiApp.use(router.middleware.routes());
      this.apiApp.use(router.middleware.allowedMethods());
    });

    this.apiApp.use(async ctx => {
      ctx.set(defaultClientHeaders);
      await clientAppHandler(ctx.req, ctx.res);
      ctx.respond = false;
    });

    this.apiApp.listen(this.appPort, () => {
      console.log(`Listening on port ${this.appPort}...`);
    });
  }

  public static get instance(): Server {
    singleton = singleton || new Server();

    return singleton;
  }
}
