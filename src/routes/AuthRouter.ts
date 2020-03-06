import Koa from 'koa';
import Router from './Router';
import { v4 as uuidv4 } from 'uuid';

type AccountLoginParameters = {
  username: string;
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
    const { username, password } = ctx.request.body as AccountLoginParameters;

    ctx.cookies.set(this.sessionName, uuidv4(), super.sessionConfig);

    ctx.body = { msg: 'ok' };
  }

  private async register(ctx: Koa.ParameterizedContext) {
    const { username, password } = ctx.request.body as AccountLoginParameters;

    ctx.cookies.set(this.sessionName, uuidv4(), super.sessionConfig);

    ctx.body = { msg: 'ok' };
  }
}
