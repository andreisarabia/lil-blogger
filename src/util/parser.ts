import axios from 'axios';
import striptags from 'striptags';
import { JSDOM } from 'jsdom';
import Mercury, { ParseResult } from '@postlight/mercury-parser';

import { sanitizeHtml } from './sanitizers';
import { extractSlug } from './url';
import { ALLOWED_HTML_TAGS } from '../constants';

import { ParsedArticleResult } from '../typings';

const extractCanonicalUrl = (html: string): string | null => {
  const linkTags = new JSDOM(html).window.document.querySelectorAll('link');

  for (const tag of linkTags) if (tag.rel === 'canonical') return tag.href;

  return null;
};

export const extractUrlData = async (
  url: string
): Promise<ParsedArticleResult> => {
  const start = Date.now();
  const { data: dirtyHtml }: { data: string } = await axios.get(url);
  const timeToFetch = Date.now() - start;

  const html = sanitizeHtml(dirtyHtml, { ADD_TAGS: ['link'] });
  const parsedResult: ParseResult = await Mercury.parse(url, {
    html: Buffer.from(html, 'utf-8'), // using a Buffer instead of string maintains special characters
  });
  const timeToParse = Date.now() - (timeToFetch + start);

  return <ParsedArticleResult>{
    ...parsedResult,
    timeToFetch,
    timeToParse,
    content: striptags(<string>parsedResult.content, ALLOWED_HTML_TAGS),
    createdOn: new Date().toISOString(),
    canonicalUrl: extractCanonicalUrl(html) || url,
    slug: extractSlug(url),
    sizeInBytes: Buffer.byteLength(html),
  };
};
