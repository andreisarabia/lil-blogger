import { JSDOM } from 'jsdom';

export const is_url = (url: string): boolean => {
  try {
    return Boolean(new URL(url));
  } catch {
    return false;
  }
};

export const extract_slug = (url: string): string => {
  const { pathname } = new URL(url); // easier to parse URLs with queries
  const lastPartOfUrl = pathname.substring(pathname.lastIndexOf('/'));

  return lastPartOfUrl;
};

export const extract_canonical_url = (html: string): string => {
  const linkTags = new JSDOM(html).window.document.querySelectorAll('link');

  for (const tag of linkTags) if (tag.rel === 'canonical') return tag.href;

  return null;
};