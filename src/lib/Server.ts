import Koa from 'koa';
import koaBody from 'koa-body';
import nextApp from 'next';
import chalk from 'chalk';

import config from '../config';
import Database from '../lib/Database';
import routers from '../routes';
import { is_url } from '../util/fn';

type ContentSecurityPolicy = {
  [k: string]: string[];
};

const log = console.log;

let singleton: Server = null;

export default class Server {
  private apiApp = new Koa();
  private clientApp = nextApp({ dir: './client', dev: config.IS_DEV });
  private readonly appPort = parseInt(process.env.APP_PORT, 10) || 3000;
  private readonly csp: ContentSecurityPolicy = {
    'default-src': ['self', 'https://fonts.gstatic.com'],
    'script-src': ['self', 'unsafe-inline'],
    'style-src': [
      'self',
      'unsafe-inline',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ]
  };

  private constructor() {}

  private get cspHeader(): string {
    let header = '';

    for (const [src, directives] of Object.entries(this.csp)) {
      const preppedDirectives = directives.map(directive =>
        is_url(directive) ? directive : `'${directive}'`
      );

      if (config.IS_DEV) preppedDirectives.push('http://localhost');

      const directiveRule = `${src} ${preppedDirectives.join(' ')}`;

      header += header === '' ? directiveRule : `; ${directiveRule}`;
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

  private attach_middlewares() {
    const defaultApiHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'deny',
      'X-XSS-Protection': '1; mode=block'
    };

    this.apiApp.use(koaBody({ json: true }));

    this.apiApp.use(async (ctx, next) => {
      const start = process.hrtime();

      ctx.set(defaultApiHeaders);

      try {
        await next();
      } catch (error) {
        throw error;
      } finally {
        const [seconds, nanoSeconds] = process.hrtime(start);
        const xResponseTime = `${seconds * 1000 + nanoSeconds / 1000000}ms`;
        const logMsg = `${ctx.method} ${ctx.path} (${ctx.status}) - ${xResponseTime}`;

        log(
          ctx.status >= 400
            ? chalk.bgRed(logMsg)
            : ctx.status >= 300
            ? chalk.inverse(logMsg)
            : chalk.cyan(logMsg)
        );

        if (config.IS_DEV) ctx.set('X-Response-Time', xResponseTime);
      }
    });

    routers.forEach(router => {
      log(router.allPaths);
      this.apiApp.use(router.middleware.routes());
      this.apiApp.use(router.middleware.allowedMethods());
    });

    if (config.SHOULD_COMPILE) {
      const clientAppHandler = this.clientApp.getRequestHandler();
      const defaultClientHeaders = {
        'Content-Security-Policy': this.cspHeader // preferably set on the server e.g. Nginx/Apache
      };

      this.apiApp.use(async ctx => {
        ctx.set(defaultClientHeaders);
        await clientAppHandler(ctx.req, ctx.res);
        ctx.respond = false;
      });
    }
  }

  public async setup() {
    if (config.SHOULD_COMPILE) {
      await Promise.all([
        this.initialize_client_app(),
        this.initialize_database()
      ]);
    } else {
      await this.initialize_database();
    }

    this.attach_middlewares();
  }

  public start(): void {
    this.apiApp.listen(this.appPort, () => {
      console.log(`Listening on port ${this.appPort}...`);
    });
  }

  public static get instance(): Server {
    singleton = singleton || new Server();

    return singleton;
  }
}
