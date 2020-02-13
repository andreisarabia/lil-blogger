import Koa from 'koa';
import KoaRouter from 'koa-router';
import nextApp from 'next';

const start = async () => {
  const clientApp = nextApp({ dir: './client', dev: true });
  const clientAppHandler = clientApp.getRequestHandler();

  await clientApp.prepare();

  const app = new Koa();
  const router = new KoaRouter();

  router.get('*', async ctx => await clientAppHandler(ctx.req, ctx.res));

  app.use(router.routes()).use(router.allowedMethods());

  app.listen(process.env.APP_PORT || 3000, () => {
    console.log('Listening on port 3000');
  });
};

start().catch(console.error);
