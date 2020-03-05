import { IncomingMessage, ServerResponse } from 'http';
import { UrlWithParsedQuery } from 'url';

import Koa from 'koa';
import koaBody from 'koa-body';
import koaSession from 'koa-session';
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
  private app = new Koa();
  private clientApp = nextApp({ dir: './client', dev: config.IS_DEV });
  private clientAppHandler: (
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl?: UrlWithParsedQuery
  ) => Promise<void>;
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
  private readonly sessionConfig = {
    key: '__app',
    maxAge: 100000,
    overwrite: true,
    signed: true,
    httpOnly: true,
    autoCommit: false
  };
  private cookieJar: string[] = ['__app'];

  private constructor() {
    this.clientAppHandler = this.clientApp.getRequestHandler();
  }

  private get cspHeader(): string {
    let header = '';

    Object.entries(this.csp).forEach(([src, directives]) => {
      const preppedDirectives = directives.map(directive =>
        is_url(directive) ? directive : `'${directive}'`
      );

      if (config.IS_DEV) preppedDirectives.push('http://localhost');

      const directiveRule = `${src} ${preppedDirectives.join(' ')}`;

      header += header === '' ? directiveRule : `; ${directiveRule}`;
    });

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

  private attach_api_routes() {
    const defaultApiHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'deny',
      'X-XSS-Protection': '1; mode=block'
    };

    const is_logged_in = (ctx: Koa.ParameterizedContext) =>
      this.cookieJar.some(cookie => Boolean(ctx.cookies.get(cookie)));

    this.app.keys = ['_app'];

    this.app.use(koaSession(this.sessionConfig, this.app));

    this.app.use(koaBody({ json: true }));

    this.app.use(async (ctx, next) => {
      if (ctx.path.startsWith('/login') || is_logged_in(ctx)) {
        await next();
      } else {
        if (ctx.path.startsWith('/_next')) {
          await next();
        } else {
          ctx.redirect('/login');
        }
      }
    });

    this.app.use(async (ctx, next) => {
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

        if (config.IS_DEV) ctx.set('X-Response-Time', xResponseTime);

        if (ctx.session) {
          ctx.session.views = ctx.session.views + 1 || 1;
          log(`Views: ${ctx.session.views}`);
          await ctx.session.manuallyCommit();
        }

        if (ctx.status >= 400) {
          log(chalk.bgRed(logMsg));
        } else if (ctx.status >= 300) {
          log(chalk.inverse(logMsg));
        } else {
          log(chalk.cyan(logMsg));
        }
      }
    });

    routers.forEach(router => {
      log(router.allPaths);
      if (router.sessionCookie) this.cookieJar.push(router.sessionCookie);
      this.app.use(router.middleware.routes());
      this.app.use(router.middleware.allowedMethods());
    });
  }

  private attach_client_routes() {
    const defaultClientHeaders = {
      'Content-Security-Policy': this.cspHeader // preferably set on the server e.g. Nginx/Apache
    };

    this.app.use(async ctx => {
      ctx.set(defaultClientHeaders);
      await this.clientAppHandler(ctx.req, ctx.res);
      ctx.respond = false;
      if (ctx.session) ctx.session = null; // prevent err w/ Next so as to not send already sent headers
    });
  }

  private attach_error_handler() {
    this.app.on('error', err => {
      log(err, new Date().toLocaleString());
    });
  }

  private attach_middlewares() {
    this.attach_api_routes();
    this.attach_client_routes();
    this.attach_error_handler();
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
    this.app.listen(this.appPort, () => {
      console.log(`Listening on port ${this.appPort}...`);
    });
  }

  public static get instance(): Server {
    singleton = singleton || new Server();

    return singleton;
  }
}
