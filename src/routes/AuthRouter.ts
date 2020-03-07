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

    let error: string = null;
    let msg = '';

    if (await User.validate_login({ email, password })) {
      ctx.cookies.set(this.sessionName, uuidv4(), super.sessionConfig);
      msg = 'ok';
    } else {
      ctx.status = 400;
      error =
        'Could not validate the email and password combination. Please try again.';
    }

    ctx.body = { error, msg };
  }

  private async register(ctx: Koa.ParameterizedContext) {
    const { email, password } = ctx.request.body as AccountLoginParameters;
    const userData = { email, password };

    let errors: string[] = null;
    let msg = '';

    try {
      errors = await User.verify_user_data(userData);

      if (errors) {
        ctx.status = 400;
      } else {
        const user = await User.create(userData);
        await user.save();

        ctx.cookies.set(this.sessionName, uuidv4(), super.sessionConfig);

        msg = 'ok';
      }
    } catch (error) {
      ctx.status = 400;
      errors = [
        'Something went wrong with creating your account. Please try again.'
      ];

      if (config.IS_DEV && error instanceof Error) {
        if (error.stack) console.log(error.stack);

        errors.push(error.message);
      }
    }

    ctx.body = { errors, msg };
  }
}
