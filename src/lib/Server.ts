import { IncomingMessage, ServerResponse } from 'http';
import { UrlWithParsedQuery } from 'url';

import Koa from 'koa';
import koaBody from 'koa-body';
import koaSession from 'koa-session';
import nextApp from 'next';
import chalk from 'chalk';

import Database from './Database';
import User from '../models/User';
import { Router, AuthRouter, ArticleRouter } from '../routes';
import config from '../config';
import { is_url } from '../util/url';

type ContentSecurityPolicy = {
  [k: string]: string[];
};

const log = console.log;
const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;
const FILE_TYPES = ['_next', '.ico', '.json'];

// helpers
const has_session = (ctx: Koa.ParameterizedContext) =>
  Boolean(ctx.cookies.get('__app'));

const is_static_file = (path: string) =>
  FILE_TYPES.some((type) => path.includes(type));

const routers = [new AuthRouter(), new ArticleRouter()]; // api

export default class Server {
  private static singleton = new Server();

  private app = new Koa();
  private readonly appPort =
    parseInt(process.env.APP_PORT as string, 10) || 3000;

  private apiPathsMap = new Map<string, string[]>();
  private clientApp = nextApp({ dir: './client', dev: config.IS_DEV });

  private clientAppHandler: (
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl?: UrlWithParsedQuery
  ) => Promise<void> = this.clientApp.getRequestHandler();

  private readonly csp: ContentSecurityPolicy = {
    'default-src': ['self', 'https://fonts.gstatic.com'],
    'script-src': ['self', 'unsafe-inline'],
    'style-src': [
      'self',
      'unsafe-inline',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
  };

  private readonly sessionConfig = {
    key: '__app',
    maxAge: ONE_DAY_IN_MS,
    overwrite: true,
    signed: true,
    httpOnly: true,
    autoCommit: false,
  };

  private stats: { [k: string]: number | null } = {
    dbStartup: null,
    clientStartup: null,
  };

  private constructor() {}

  private get cspHeader(): string {
    let header = '';

    Object.entries(this.csp).forEach(([src, directives]) => {
      const preppedDirectives = directives.map((directive) =>
        is_url(directive) ? directive : `'${directive}'`
      );

      const directiveRule = `${src} ${preppedDirectives.join(' ')}`;

      header += header === '' ? directiveRule : `; ${directiveRule}`;
    });

    return header;
  }

  private async initialize_client_app(): Promise<void> {
    const start = Date.now();
    await this.clientApp.prepare();
    this.stats.clientStartup = Date.now() - start;
  }

  private async initialize_database(): Promise<void> {
    const start = Date.now();
    await Database.initialize();
    this.stats.dbStartup = Date.now() - start;
  }

  private attach_api_routes() {
    const defaultApiHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'deny',
      'X-XSS-Protection': '1; mode=block',
    };

    this.app.keys = ['_app'];

    this.app
      .use(koaSession(this.sessionConfig, this.app))
      .use(koaBody({ json: true }))
      .use(async (ctx, next) => {
        const start = Date.now();
        const { path } = ctx;

        ctx.set(defaultApiHeaders);

        let viewsMsg = '';

        try {
          if (is_static_file(path)) return await next(); // handled by Next

          if (path.startsWith('/login') || path.startsWith('/api/auth')) {
            if (path.startsWith('/login')) {
              ctx.session.views = ctx.session.views + 1 || 1;
              viewsMsg = `[Views: ${ctx.session.views}]`;
            }

            await ctx.session.manuallyCommit();
            await next();
          } else if (has_session(ctx) && Router.is_authenticated(ctx)) {
            if (!path.startsWith('/api')) {
              // log only non-API calls as a `view`
              ctx.session.views = ctx.session.views + 1 || 1;
              viewsMsg = `[Views: ${ctx.session.views}]`;

              await ctx.session.manuallyCommit();
            }

            if (!ctx.session.user) {
              ctx.session.user = await User.find({
                cookie: ctx.cookies.get(Router.authCookieName),
              });
            }

            await next();
          } else {
            ctx.redirect('/login');
          }
        } finally {
          const xResponseTime = `${Date.now() - start}ms`;
          const ua = ctx.header['user-agent'];
          const logMsg = `${ctx.method} ${path} (${ctx.status}) - ${xResponseTime} ${ua} ${viewsMsg}`;

          if (config.IS_DEV) ctx.set('X-Response-Time', xResponseTime);

          if (ctx.status >= 400) log(chalk.red(logMsg));
          else if (ctx.status >= 300) log(chalk.inverse(logMsg));
          else if (is_static_file(path)) log(chalk.cyan(logMsg));
          else log(chalk.green(logMsg));
        }
      });

    routers.forEach(({ pathsMap, middleware }) => {
      for (const [path, methods] of pathsMap)
        this.apiPathsMap.set(path, methods);

      this.app.use(middleware.routes()).use(middleware.allowedMethods());
    });
  }

  private attach_client_routes() {
    const defaultClientHeaders = {
      'Content-Security-Policy': this.cspHeader, // preferably set on the server e.g. Nginx/Apache
    };

    this.app.use(async (ctx) => {
      ctx.set(defaultClientHeaders);
      await this.clientAppHandler(ctx.req, ctx.res);
      ctx.respond = false;
      // ctx.session = null; // prevent err w/ Next and its handling of headers
    });
  }

  private attach_error_handler(): void {
    this.app.on('error', (err) => {
      log(err, new Date().toLocaleString());
    });
  }

  private attach_middlewares(): void {
    this.attach_api_routes();
    this.attach_client_routes();
    this.attach_error_handler();
  }

  public async setup(): Promise<void> {
    if (config.SHOULD_COMPILE) {
      await Promise.all([
        this.initialize_client_app(),
        this.initialize_database(),
      ]);
    } else {
      await this.initialize_database();
    }

    this.attach_middlewares();
  }

  public start(): void {
    this.app.listen(this.appPort, () => {
      log(`Listening on port ${this.appPort}...`);
      log('Content Security Policy: ', this.cspHeader);
      log('Registered paths:', this.apiPathsMap);
      log(`Took ${this.stats.dbStartup}ms to connect to the database.`);
      if (config.SHOULD_COMPILE) {
        log(`Took ${this.stats.clientStartup}ms to build client application.`);
      }
    });
  }

  public static get instance(): Server {
    return this.singleton;
  }
}
