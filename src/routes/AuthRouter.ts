import Koa from 'koa';
import { v4 as uuidv4 } from 'uuid';

import Router from './Router';
import User from '../models/User';
import Article from '../models/Article';
import config from '../config';

type AccountLoginParameters = {
  email: string;
  password: string;
};

const ONE_DAY_IN_MS = 60 * 60 * 24 * 1000;

export default class AuthRouter extends Router {
  private readonly sessionConfig = {
    key: '__app',
    maxAge: ONE_DAY_IN_MS,
    overwrite: true,
    signed: true,
    httpOnly: true,
  };

  constructor() {
    super('/auth', { requiresAuth: false });

    this.instance
      .get('/reset', ctx => this.resetApp(ctx))
      .post('/login', ctx => this.login(ctx))
      .post('/register', ctx => this.register(ctx));
  }

  private async resetApp(ctx: Koa.ParameterizedContext): Promise<void> {
    if (!config.IS_DEV) return;

    try {
      await Promise.all([Article.deleteAll(), User.deleteAll()]);
      ctx.session = null;
      ctx.redirect('/');
    } catch (error) {
      console.error(error);
      ctx.body = error instanceof Error ? error.message : JSON.stringify(error);
    }
  }

  private async login(ctx: Koa.ParameterizedContext) {
    const { email = '', password = '' } = <AccountLoginParameters>(
      ctx.request.body
    );
    const user: User | null = await User.validateCredentials(email, password);

    if (user) {
      const cookie = uuidv4();

      await user.update({ cookie });
      ctx.cookies.set(Router.authCookieName, cookie, this.sessionConfig);

      ctx.body = { error: null, msg: 'ok' };
    } else {
      ctx.status = 401;

      ctx.body = {
        error:
          'Could not validate the email and password combination. Please try again.',
        msg: null,
      };
    }
  }

  private async register(ctx: Koa.ParameterizedContext) {
    const { email = '', password = '' } = <AccountLoginParameters>(
      ctx.request.body
    );
    const errors = await User.verifyUserData(email, password);

    if (errors) {
      ctx.status = 401;

      ctx.body = { errors, msg: null };
    } else {
      const cookie = uuidv4();

      await User.create(email, password, cookie);

      ctx.cookies.set(Router.authCookieName, cookie, this.sessionConfig);

      ctx.body = { errors: null, msg: 'ok' };
    }
  }
}
