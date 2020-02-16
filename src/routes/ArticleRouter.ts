import Koa from 'koa';
import Router from './Router';
import Mercury, { ParseResult } from '@postlight/mercury-parser';
import striptags from 'striptags';
import { only_alphanumeric, remove_extra_whitespace } from '../util/functions';
const mockData: ParseResult = require('../../data/examples/vox.json');

mockData.content = striptags(
  only_alphanumeric(remove_extra_whitespace(mockData.content)),
  [
    'div',
    'figure',
    'span',
    'picture',
    'source',
    'figcaption',
    'article',
    'cite',
    'p',
    'a',
    'strong',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'svg',
    'aside',
    'g',
    'path'
  ]
);
console.log(mockData);

type ParseRequestOptions = {
  url: string;
  html: string;
};

interface ParseRequestResults extends ParseResult {
  error: true;
  message: string;
}

export default class ArticleRouter extends Router {
  constructor() {
    super('/article');

    this.instance.post('/save', ctx => this.save_article(ctx));
  }

  private async save_article(ctx: Koa.ParameterizedContext): Promise<void> {
    const { url = 'https://nytimes.com', html = '' } = ctx.request
      .body as ParseRequestOptions;

    const result = (await Mercury.parse(url, { html })) as ParseRequestResults;

    if (result.error) {
      console.error(result.error);
      console.log(result);
    }

    ctx.body = result;

    // console.log(
    //   await Mercury.parse('https://nytimes.com', {
    //     html: `
    //     <html>
    //       <body>
    //         <article>
    //           <h1>Thunder (mascot)</h1>
    //           <p>Thunder is the stage name for the horse who is the official live animal mascot for the Denver Broncos</p>
    //         </article>
    //       </body>
    //     </html>`
    //   })
    // );
  }
}
