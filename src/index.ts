import Koa from 'koa';
import KoaRouter from 'koa-router';
import nextApp from 'next';
import Mercury from '@postlight/mercury-parser';

const start = async () => {
  console.log(
    await Mercury.parse('https://nytimes.com', {
      html: `
        <html>
          <body>
            <article>
              <h1>Thunder (mascot)</h1>
              <p>Thunder is the stage name for the horse who is the official live animal mascot for the Denver Broncos</p>
            </article>
          </body>
        </html>`
    })
  );
  const clientApp = nextApp({ dir: './client', dev: true });
  const clientAppHandler = clientApp.getRequestHandler();

  await clientApp.prepare();

  const app = new Koa();
  const router = new KoaRouter();

  app.use(async (ctx, next) => {
    if (ctx.path.startsWith('/api')) {
      await next();
    } else {
      await clientAppHandler(ctx.req, ctx.res);
      ctx.respond = false;
    }
  });

  router.get('/api', async ctx => {
    ctx.body = 'noice';
  });

  app.use(router.routes()).use(router.allowedMethods());

  app.listen(process.env.APP_PORT || 3000, () => {
    console.log('Listening on port 3000');
  });
};

start().catch(console.error);
