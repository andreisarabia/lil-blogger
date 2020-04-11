import { IncomingMessage, ServerResponse } from 'http';
import { UrlWithParsedQuery } from 'url';

import Koa from 'koa';
import koaBody from 'koa-body';
import koaSession from 'koa-session';
import koaConnect from 'koa-connect';
import compression from 'compression';
import nextApp from 'next';
import chalk from 'chalk';

import Database from './Database';
import User from '../models/User';
import { Router, AuthRouter, ArticleRouter } from '../routes';
import config from '../config';
import { isUrl } from '../util/url';

type ContentSecurityPolicy = {
  [k: string]: string[];
};

const log = console.log;
const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;
const FILE_TYPES = ['_next', '.ico', '.json'];

// helpers
const hasSession = (ctx: Koa.ParameterizedContext) =>
  Boolean(ctx.cookies.get('__app'));

const isStaticFile = (path: string) =>
  FILE_TYPES.some(type => path.includes(type));

export default class Server {
  private static singleton = new Server();

  private app = new Koa();
  private readonly port = parseInt(<string>process.env.APP_PORT, 10) || 3000;
  private apiPathsMap = new Map<string, string[]>();
  private clientApp = nextApp({ dir: './client', dev: config.IS_DEV });

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

  private stats: { [k: string]: number | null } = {
    dbStartup: null,
    clientStartup: null,
    appStartup: null,
  };

  private constructor() {
    this.app.keys = ['_app'];
  }

  private get cspHeader(): string {
    let header = '';

    for (const [src, directives] of Object.entries(this.csp)) {
      const preppedDirectives = directives.map(directive =>
        isUrl(directive) ? directive : `'${directive}'`
      );

      const directiveRule = `${src} ${preppedDirectives.join(' ')}`;

      header += header === '' ? directiveRule : `; ${directiveRule}`;
    }

    return header;
  }

  private async initializeClientApp(): Promise<void> {
    const start = Date.now();
    await this.clientApp.prepare();
    this.stats.clientStartup = Date.now() - start;
  }

  private async initializeDatabase(): Promise<void> {
    const start = Date.now();
    await Database.initialize();
    this.stats.dbStartup = Date.now() - start;
  }

  private attachInitialRequestMiddlewares() {
    const sessionConfig = {
      key: '__app',
      maxAge: ONE_DAY_IN_MS,
      overwrite: true,
      signed: true,
      httpOnly: true,
      autoCommit: false,
    }; // TODO: make secure in prod when HTTPS is needed

    this.app
      .use(koaSession(sessionConfig, this.app))
      .use(koaBody({ json: true }))
      .use(koaConnect(compression()));
  }

  private attachLoggerMiddleware() {
    const defaultApiHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'deny',
      'X-XSS-Protection': '1; mode=block',
    };

    this.app.use(async (ctx: Koa.ParameterizedContext, next: Koa.Next) => {
      const start = Date.now();
      const { path } = ctx;

      ctx.set(defaultApiHeaders);

      try {
        if (isStaticFile(path)) return await next(); // handled by Next

        if (path.startsWith('/login') || path.startsWith('/api/auth')) {
          if (path.startsWith('/login'))
            ctx.session.views = ctx.session.views + 1 || 1;

          await ctx.session.manuallyCommit();

          return await next();
        }

        if (hasSession(ctx) && Router.isAuthenticated(ctx)) {
          if (!ctx.session.user) {
            const cookie = ctx.cookies.get(Router.authCookieName) || '';
            const user = await User.find({ cookie });

            if (cookie && user) {
              ctx.session.user = user;
            } else {
              ctx.session = null;
              ctx.redirect('/login');
            }
          }

          if (!path.startsWith('/api')) {
            // log only non-API calls as a `view`
            ctx.session.views = ctx.session.views + 1 || 1;

            await ctx.session.manuallyCommit();
          }

          return await next();
        }

        ctx.redirect('/login');
      } finally {
        const xResponseTime = `${Date.now() - start}ms`;
        const { 'user-agent': ua, referer = '' } = ctx.header;
        const timestamp = new Date().toLocaleString();

        const logMsg = `${ctx.ip} - - [${timestamp}] ${ctx.method} ${path} ${ctx.status} ${xResponseTime} ${referer} - ${ua}`;

        if (config.IS_DEV) ctx.set('X-Response-Time', xResponseTime);

        if (ctx.status >= 400) log(chalk.red(logMsg));
        else if (ctx.status >= 300) log(chalk.inverse(logMsg));
        else if (isStaticFile(path)) log(chalk.cyan(logMsg));
        else log(chalk.green(logMsg));
      }
    });
  }

  private attachApiRoutes(): void {
    const routers = [new AuthRouter(), new ArticleRouter()];

    for (const { pathsMap, middleware } of routers) {
      for (const [path, methods] of pathsMap)
        this.apiPathsMap.set(path, methods);

      this.app.use(middleware.routes()).use(middleware.allowedMethods());
    }
  }

  private attachClientRoutes(): void {
    const defaultClientHeaders = {
      'Content-Security-Policy': this.cspHeader, // preferably set on the server e.g. Nginx/Apache
    };
    const clientAppHandler: (
      req: IncomingMessage,
      res: ServerResponse
    ) => Promise<void> = this.clientApp.getRequestHandler();

    this.app.use(async ctx => {
      ctx.set(defaultClientHeaders);
      await clientAppHandler(ctx.req, ctx.res);
      ctx.respond = false;
    });
  }

  private attachErrorHandler(): void {
    this.app.on('error', err => {
      log(err instanceof Error ? err.stack : err, new Date().toLocaleString());
    });
  }

  private attachMiddlewares(): void {
    this.attachInitialRequestMiddlewares();
    this.attachLoggerMiddleware();
    this.attachApiRoutes();
    this.attachClientRoutes();
    this.attachErrorHandler();
  }

  public async setup(): Promise<void> {
    if (config.SHOULD_COMPILE) {
      await Promise.all([
        this.initializeClientApp(),
        this.initializeDatabase(),
      ]);
    } else {
      await this.initializeDatabase();
    }

    this.attachMiddlewares();
  }

  public start(): void {
    this.app.listen(this.port, () => {
      log(`Listening on port ${this.port}...`);
      log('Content Security Policy: ', this.csp);
      log('Registered API paths:', this.apiPathsMap);
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
