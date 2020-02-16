import Koa from 'koa';
import koaBody from 'koa-body';
import nextApp from 'next';
import Database from './lib/Database';
import routers from './routes/routers';

const IS_PROD = process.env.NODE_ENV === 'production';

const start = async () => {
  await Database.initialize();

  const app = new Koa();

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

  if (IS_PROD) {
    // dev work on nuxt should use npm commands in package.json
    const clientApp = nextApp({ dir: './client', dev: false });
    const clientAppHandler = clientApp.getRequestHandler();

    await clientApp.prepare();

    app.use(async ctx => {
      await clientAppHandler(ctx.req, ctx.res);
      ctx.respond = false;
    });
  }

  app.listen(process.env.APP_PORT || 3000, () => {
    console.log('Listening on port 3000');
  });
};

start().catch(console.error);
