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
const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;

let singleton: Server = null;

export default class Server {
  private app = new Koa();
  private readonly appPort = parseInt(process.env.APP_PORT, 10) || 3000;
  private apiPathsMethodsMap = new Map<string, string[]>();
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
      'https://fonts.gstatic.com'
    ]
  };

  private readonly sessionConfig = {
    key: '__app',
    maxAge: ONE_DAY_IN_MS,
    overwrite: true,
    signed: true,
    httpOnly: true,
    autoCommit: false
  };

  private stats: { dbStartup: number; clientStartup: number } = {
    dbStartup: null,
    clientStartup: null
  };

  private constructor() {}

  private get cspHeader(): string {
    let header = '';

    Object.entries(this.csp).forEach(([src, directives]) => {
      const preppedDirectives = directives.map(directive =>
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
    this.stats['clientStartup'] = Date.now() - start;
  }

  private async initialize_database(): Promise<void> {
    const start = Date.now();
    await Database.initialize();
    this.stats['dbStartup'] = Date.now() - start;
  }

  private has_session(ctx: Koa.ParameterizedContext) {
    return Boolean(ctx.cookies.get('__app'));
  }

  private is_authenticated(ctx: Koa.ParameterizedContext) {
    return Boolean(ctx.cookies.get('_app_auth'));
  }

  private is_static_file(path: string) {
    return ['_next', '.ico', '.json'].some(urlSegment =>
      path.includes(urlSegment)
    );
  }

  /**
   * We pass down the request through the middleware chain only if:
   * user is trying to access `/login` (Next route) or `/auth` (API route)
   * user is requesting static resources (Next)
   * user has a session beforehand AND has authenticated their info
   */
  private does_not_require_login(ctx: Koa.ParameterizedContext) {
    const { path } = ctx;
    return (
      path.startsWith('/login') ||
      path.startsWith('/auth') ||
      this.is_static_file(path) ||
      this.has_session(ctx) ||
      this.is_authenticated(ctx)
    );
  }

  private attach_api_routes() {
    const defaultApiHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'deny',
      'X-XSS-Protection': '1; mode=block'
    };

    this.app.keys = ['_app'];

    this.app
      .use(koaSession(this.sessionConfig, this.app))
      .use(koaBody({ json: true }))
      .use(async (ctx, next) => {
        const start = Date.now();

        ctx.set(defaultApiHeaders);

        let viewsMsg = '';

        try {
          if (!this.is_static_file(ctx.path) && !ctx.path.startsWith('/api')) {
            ctx.session.views = ctx.session.views + 1 || 1;
            viewsMsg = `[Views: ${ctx.session.views}]`;
            await ctx.session.manuallyCommit();
          }

          if (this.does_not_require_login(ctx)) {
            await next();
          } else {
            ctx.redirect('/login'); // handled by Next
          }
        } finally {
          const xResponseTime = `${Date.now() - start}ms`;

          if (config.IS_DEV && !ctx.headerSent)
            ctx.set('X-Response-Time', xResponseTime);

          const logMsg = `${ctx.method} ${ctx.path} (${ctx.status}) - ${xResponseTime} ${viewsMsg}`;

          let chalkLog: string;

          if (ctx.status >= 400) chalkLog = chalk.red(logMsg);
          else if (ctx.status >= 300) chalkLog = chalk.inverse(logMsg);
          else if (this.is_static_file(ctx.path)) chalkLog = chalk.cyan(logMsg);
          else chalkLog = chalk.green(logMsg);

          log(chalkLog);
        }
      });

    routers.forEach(({ pathsMap, middleware }) => {
      for (const [path, methods] of pathsMap)
        this.apiPathsMethodsMap.set(path, methods);

      this.app.use(middleware.routes()).use(middleware.allowedMethods());
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
      // ctx.session = null; // prevent err w/ Next and its handling of headers
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
      log(`Listening on port ${this.appPort}...`);
      log('Content Security Policy: ', this.cspHeader);
      log('Registered paths:', this.apiPathsMethodsMap);
      log(`Took ${this.stats['dbStartup']}ms to connect to the database.`);
      if (config.SHOULD_COMPILE) {
        log(
          `Took ${this.stats['clientStartup']}ms to build client application.`
        );
      }
    });
  }

  public static get instance(): Server {
    singleton = singleton || new Server();

    return singleton;
  }
}
