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
    maxAge: 100000,
    overwrite: true,
    signed: true,
    httpOnly: true,
    autoCommit: false
  };

  private constructor() {}

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

    this.app.use(koaSession(this.sessionConfig, this.app));

    this.app.use(koaBody({ json: true }));

    this.app.use(async (ctx, next) => {
      const start = process.hrtime();

      ctx.set(defaultApiHeaders);

      let viewsMsg = '';

      try {
        if (!this.is_static_file(ctx.path) && !ctx.path.startsWith('/api')) {
          ctx.session.views = ctx.session.views + 1 || 1;
          viewsMsg = `[Views: ${ctx.session.views}]`;
          await ctx.session.manuallyCommit();
        }

        ctx.state.render = this.clientApp.render.bind(this.clientApp);

        if (this.does_not_require_login(ctx)) {
          await next();
        } else {
          ctx.redirect('/login'); // handled by Next
        }
      } finally {
        const [seconds, nanoSeconds] = process.hrtime(start);
        const xResponseTime = `${seconds * 1000 + nanoSeconds / 1000000}ms`;

        if (config.IS_DEV && !ctx.headerSent)
          ctx.set('X-Response-Time', xResponseTime);

        const chalkMsg = `${ctx.method} ${ctx.path} (${ctx.status}) - ${xResponseTime} ${viewsMsg}`;

        let chalkLog: string;

        if (ctx.status >= 400) chalkLog = chalk.red(chalkMsg);
        else if (ctx.status >= 300) chalkLog = chalk.inverse(chalkMsg);
        else if (this.is_static_file(ctx.path)) chalkLog = chalk.cyan(chalkMsg);
        else chalkLog = chalk.green(chalkMsg);

        log(chalkLog);
      }
    });

    routers.forEach(({ pathsMap, middleware }) => {
      for (const [path, methods] of pathsMap)
        this.apiPathsMethodsMap.set(path, methods);

      this.app.use(middleware.routes()).use(middleware.allowedMethods());
    });

    log(this.csp);
    log(this.apiPathsMethodsMap);
  }

  private attach_client_routes() {
    const defaultClientHeaders = {
      'Content-Security-Policy': this.cspHeader // preferably set on the server e.g. Nginx/Apache
    };

    this.app.use(async ctx => {
      ctx.set(defaultClientHeaders);
      await this.clientAppHandler(ctx.req, ctx.res);
      ctx.respond = false;
      ctx.session = null; // prevent err w/ Next and its handling of headers
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
