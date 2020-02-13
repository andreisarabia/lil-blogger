import Koa from 'koa';
import Router from './Router';
import Mercury, { ParseResult } from '@postlight/mercury-parser';

type ParseRequestOptions = {
  url: string;
  html: string;
};

export default class ArticleRouter extends Router {
  constructor() {
    super('article');

    this.instance.post('/parse', ctx => this.parse_article(ctx));
  }

  private async parse_article(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url = 'https://example.com', html = '' } = ctx.request
      .body as ParseRequestOptions;

    const result: ParseResult = await Mercury.parse(url, { html });
    
    ctx.body = result;

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
  }
}
