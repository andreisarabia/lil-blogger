import createPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DEFAULT_PURIFY_CONFIG = { WHOLE_DOCUMENT: true };
const EXTRA_WHITESPACE_REGEX = /\s\s+/g;
const localPurifier = createPurify(<any>new JSDOM('').window);

export const sanitize_html = (
  html: string,
  options: createPurify.Config = {}
): string => {
  const sanitizerOpts = { ...DEFAULT_PURIFY_CONFIG, ...options };

  return <string>(
    localPurifier.sanitize(remove_extra_whitespace(html), sanitizerOpts)
  );
};

export const remove_extra_whitespace = (str: string) =>
  str.replace(EXTRA_WHITESPACE_REGEX, '');
