import Koa from 'koa';
import nextApp from 'next';
import routers from './routes';

const IS_DEV = process.env.NODE_ENV !== 'production';

const start = async () => {
  const clientApp = nextApp({ dir: './client', dev: IS_DEV });
  const clientAppHandler = clientApp.getRequestHandler();

  await clientApp.prepare();

  const app = new Koa();

  routers.forEach(router => {
    app.use(router.middleware.routes()).use(router.middleware.allowedMethods());
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
