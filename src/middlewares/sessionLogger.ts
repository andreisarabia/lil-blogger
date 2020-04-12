import Koa from 'koa';
import chalk from 'chalk';

import User from '../models/User';
import { Router } from '../routes';
import config from '../config';

const FILE_TYPES = ['_next', '.ico', '.json'];

const log = console.log;

const isNextFile = (path: string) =>
  FILE_TYPES.some(type => path.includes(type));

const hasSession = (ctx: Koa.ParameterizedContext) =>
  Boolean(ctx.cookies.get('__app'));

const shouldBeRedirected = (ctx: Koa.ParameterizedContext) =>
  !(hasSession(ctx) && Router.isAuthenticated(ctx));

const populateSessionUser = async (ctx: Koa.ParameterizedContext) => {
  const user: User | null = await User.find({
    cookie: ctx.cookies.get(Router.authCookieName),
  });

  if (user) {
    ctx.session.user = user;
  } else {
    ctx.session = null;
    ctx.redirect('/login');
  }
};

const handleRequest = async (ctx: Koa.ParameterizedContext, next: Koa.Next) => {
  const { path } = ctx;

  if (isNextFile(path)) return await next(); // handled by Next

  if (path.startsWith('/login') || path.startsWith('/api/auth')) {
    if (path.startsWith('/login'))
      ctx.session.views = ctx.session.views + 1 || 1;

    await ctx.session.manuallyCommit();

    return await next();
  }

  if (shouldBeRedirected(ctx)) return ctx.redirect('/login');

  if (ctx.session.user) await ctx.session.manuallyCommit();
  else await populateSessionUser(ctx);

  if (!path.startsWith('/api')) ctx.session.views = ctx.session.views + 1 || 1; // count non-API calls as a `view`

  await next();
};

const logRequest = (ctx: Koa.ParameterizedContext, xResponseTime: string) => {
  const { ip, method, path, status } = ctx;
  const { 'user-agent': ua, referer = '' } = ctx.header;
  const timestamp = new Date().toISOString();

  let logMsg = `${ip} - - [${timestamp}] ${method} ${path} ${status} ${xResponseTime}`;

  if (referer) logMsg += ` ${referer}`;
  logMsg += ` ${ua}`;
  if (ctx.session.views) logMsg += ` (${ctx.session.views})`;

  if (status >= 400) log(chalk.red(logMsg));
  else if (status >= 300) log(chalk.inverse(logMsg));
  else if (isNextFile(path)) log(chalk.cyan(logMsg));
  else log(chalk.green(logMsg));
};

export default () => {
  const defaultApiHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'deny',
    'X-XSS-Protection': '1; mode=block',
  };

  return async (ctx: Koa.ParameterizedContext, next: Koa.Next) => {
    const start = Date.now();

    try {
      ctx.set(defaultApiHeaders);

      await handleRequest(ctx, next);
    } finally {
      const xResponseTime = `${Date.now() - start}ms`;

      if (config.IS_DEV) ctx.set('X-Response-Time', xResponseTime);

      logRequest(ctx, xResponseTime);
    }
  };
};
