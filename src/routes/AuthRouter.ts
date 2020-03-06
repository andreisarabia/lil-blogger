import Koa from 'koa';
import Router from './Router';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';

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
    const { email, password } = ctx.request.body as AccountLoginParameters;

    ctx.cookies.set(this.sessionName, uuidv4(), super.sessionConfig);

    ctx.body = { msg: 'ok' };
  }

  private async register(ctx: Koa.ParameterizedContext) {
    const { email, password } = ctx.request.body as AccountLoginParameters;

    const registrationErrors = await User.verify_user_params({
      email,
      password
    });

    if (registrationErrors.length > 0) {
      ctx.body = { errors: registrationErrors };
    } else {
      ctx.cookies.set(this.sessionName, uuidv4(), super.sessionConfig);

      ctx.body = { msg: 'ok' };
    }
  }
}
