import createPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DEFAULT_PURIFY_CONFIG = { WHOLE_DOCUMENT: true };
const EXTRA_WHITESPACE_REGEX = /\s\s+/g;
const localPurifier = createPurify(<any>new JSDOM('').window);

const removeExtraWhitespace = (str: string) =>
  str.replace(EXTRA_WHITESPACE_REGEX, '');

export const sanitizeHtml = (
  html: string,
  options: createPurify.Config = {}
): string => {
  options = { ...DEFAULT_PURIFY_CONFIG, ...options };

  return <string>localPurifier.sanitize(removeExtraWhitespace(html), options);
};
