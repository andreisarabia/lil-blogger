import Koa from 'koa';
import koaBody from 'koa-body';
import nextApp from 'next';
import Database from './lib/Database';
import routers from './routes/routers';

const IS_DEV = process.env.NODE_ENV !== 'production';

const start = async () => {
  const clientApp = nextApp({ dir: './client', dev: IS_DEV });
  const clientAppHandler = clientApp.getRequestHandler();
  const app = new Koa();

  await Promise.all([clientApp.prepare(), Database.initialize()]);

  app.use(async (ctx, next) => {
    const start = Date.now();
    try {
      await next();
    } catch (error) {
      throw error;
    } finally {
      const { method, path, status } = ctx;
      const xResponseTime = Date.now() - start;
      console.log(`${method} ${path} (${status}) - ${xResponseTime}ms`);
    }
  });

  app.use(koaBody({ json: true }));

  routers.forEach(router => {
    console.log(router.allPaths);
    app.use(router.middleware.routes());
    app.use(router.middleware.allowedMethods());
  });

  app.use(async ctx => {
    await clientAppHandler(ctx.req, ctx.res);
    ctx.respond = false;
  });

  app.listen(process.env.APP_PORT || 3000, () => {
    console.log('Listening on port 3000');
  });
};

start().catch(console.error);
