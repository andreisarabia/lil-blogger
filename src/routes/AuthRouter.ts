import Koa from 'koa';
import { v4 as uuidv4 } from 'uuid';

import Router from './Router';
import User from '../models/User';
import config from '../config';

type AccountLoginParameters = {
  email: string;
  password: string;
};

export default class AuthRouter extends Router {
  public readonly sessionName = '_app_auth';

  constructor() {
    super('/auth');

    this.instance
      .post('/login', ctx => this.login(ctx))
      .post('/register', ctx => this.register(ctx));
  }

  private async login(ctx: Koa.ParameterizedContext) {
    const { email = '', password } = ctx.request.body as AccountLoginParameters;

    if (await User.validate_login(email, password)) {
      const cookie = uuidv4();
      const user = await User.find({ email });

      await user.update({ cookie });
      ctx.cookies.set(this.sessionName, cookie, super.sessionConfig);

      ctx.body = { error: null, msg: '' };
    } else {
      ctx.status = 400;
      const error =
        'Could not validate the email and password combination. Please try again.';

      ctx.body = { error, msg: '' };
    }
  }

  private async register(ctx: Koa.ParameterizedContext) {
    const { email, password } = ctx.request.body as AccountLoginParameters;

    const errors = await User.verify_user_data(email, password);

    if (errors) {
      ctx.status = 400;

      ctx.body = { errors, msg: '' };
    } else {
      const cookie = uuidv4();
      const user = await User.create({ email, password, cookie });

      await user.save();
      ctx.cookies.set(this.sessionName, cookie, super.sessionConfig);

      ctx.body = { errors: null, msg: 'ok' };
    }
  }
}
