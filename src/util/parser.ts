import axios from 'axios';
import striptags from 'striptags';
import { JSDOM } from 'jsdom';
import Mercury, { ParseResult } from '@postlight/mercury-parser';

import { sanitize_html } from './sanitizers';
import { extract_slug } from './url';
import { ALLOWED_HTML_TAGS } from '../constants';

import { ParsedArticleResult } from '../typings';

const extract_canonical_url = (html: string): string => {
  const linkTags = new JSDOM(html).window.document.querySelectorAll('link');

  for (const tag of linkTags) if (tag.rel === 'canonical') return tag.href;

  return null;
};

export const extract_url_data = async (
  url: string
): Promise<ParsedArticleResult> => {
  const start = Date.now();

  const { data: dirtyHtml }: { data: string } = await axios.get(url);
  const timeToFetch = Date.now() - start;
  const html = sanitize_html(dirtyHtml, { ADD_TAGS: ['link'] });
  const parserOpts = { html: Buffer.from(html, 'utf-8') };
  const parsedResult: ParseResult = await Mercury.parse(url, parserOpts);

  parsedResult.content = striptags(parsedResult.content, ALLOWED_HTML_TAGS);

  const createdOn = new Date().toISOString();
  const canonicalUrl = extract_canonical_url(html) || url;
  const slug = extract_slug(url);
  const timeToParse = Date.now() - (timeToFetch + start);

  return {
    ...parsedResult,
    createdOn,
    canonicalUrl,
    slug,
    timeToFetch,
    timeToParse
  } as ParsedArticleResult;
};
