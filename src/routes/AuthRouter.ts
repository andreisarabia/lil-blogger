import Koa from 'koa';
import Router from './Router';
import { v4 as uuidv4 } from 'uuid';

type LoginParameters = {
  username: string;
  password: string;
};

export default class AuthRouter extends Router {
  public readonly sessionCookie = '_app_auth';

  constructor() {
    super('/auth');

    this.instance.post('/login', ctx => this.login(ctx));
  }

  private async login(ctx: Koa.ParameterizedContext) {
    const { username, password } = ctx.request.body as LoginParameters;

    console.log(username);
    console.log(password);

    ctx.cookies.set(this.sessionCookie, uuidv4());

    ctx.redirect('/');
  }
}
