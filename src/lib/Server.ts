import { IncomingMessage, ServerResponse } from 'http';

import Koa from 'koa';
import koaBody from 'koa-body';
import koaSession from 'koa-session';
import koaConnect from 'koa-connect';
import compression from 'compression';
import nextApp from 'next';

import Database from './Database';
import { AuthRouter, ArticleRouter } from '../routes';
import sessionLogger from '../middlewares/sessionLogger';
import config from '../config';
import { isUrl } from '../util/url';

type ContentSecurityPolicy = {
  [k: string]: string[];
};

const log = console.log;
const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;

export default class Server {
  private static singleton = new Server();

  #app = new Koa();
  readonly #port = parseInt(<string>process.env.APP_PORT, 10) || 3000;
  #apiPathsMap = new Map<string, string[]>();
  #clientApp = nextApp({ dir: './client', dev: config.IS_DEV });

  readonly #csp: ContentSecurityPolicy = {
    'default-src': ['self', 'https://fonts.gstatic.com'],
    'script-src': ['self', 'unsafe-inline'],
    'style-src': [
      'self',
      'unsafe-inline',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
  };

   #stats: { [k: string]: number | null } = {
    dbStartup: null,
    clientStartup: null,
    appStartup: null,
  };

  private constructor() {
    this.#app.keys = ['_app'];
  }

  private get cspHeader(): string {
    let header = '';

    for (const [src, directives] of Object.entries(this.#csp)) {
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
    await this.#clientApp.prepare();
    this.#stats.clientStartup = Date.now() - start;
  }

  private async initializeDatabase(): Promise<void> {
    const start = Date.now();
    await Database.initialize();
    this.#stats.dbStartup = Date.now() - start;
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

    this.#app
      .use(koaSession(sessionConfig, this.#app))
      .use(koaBody({ json: true }))
      .use(koaConnect(compression()));
  }

  private attachLoggerMiddleware() {
    this.#app.use(sessionLogger());
  }

  private attachApiRoutes(): void {
    const routers = [new AuthRouter(), new ArticleRouter()];

    for (const { pathsMap, middleware } of routers) {
      for (const [path, methods] of pathsMap)
        this.#apiPathsMap.set(path, methods);

      this.#app.use(middleware.routes()).use(middleware.allowedMethods());
    }
  }

  private attachClientRoutes(): void {
    const defaultClientHeaders = {
      'Content-Security-Policy': this.cspHeader, // preferably set on the server e.g. Nginx/Apache
    };
    const clientAppHandler: (
      req: IncomingMessage,
      res: ServerResponse
    ) => Promise<void> = this.#clientApp.getRequestHandler();

    this.#app.use(async ctx => {
      ctx.set(defaultClientHeaders);
      await clientAppHandler(ctx.req, ctx.res);
      ctx.respond = false;
    });
  }

  private attachErrorHandler(): void {
    this.#app.on('error', err => {
      log(err instanceof Error ? err.stack : err, new Date().toISOString());
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
    this.#app.listen(this.#port, () => {
      log(`Listening on port ${this.#port}...`);
      log('Content Security Policy: ', this.#csp);
      log('Registered API paths:', this.#apiPathsMap);
      log(`Took ${this.#stats.dbStartup}ms to connect to the database.`);
      if (config.SHOULD_COMPILE) {
        log(`Took ${this.#stats.clientStartup}ms to build client application.`);
      }
    });
  }

  public static get instance(): Server {
    return this.singleton;
  }
}
