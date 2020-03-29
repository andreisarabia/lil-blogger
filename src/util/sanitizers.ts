import createPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DEFAULT_PURIFY_CONFIG = { WHOLE_DOCUMENT: true };
const EXTRA_WHITESPACE_REGEX = /\s\s+/g;
const localPurifier = createPurify(new JSDOM('').window as any);

export const sanitize_html = (
  html: string,
  options: createPurify.Config = {}
): string => {
  const sanitizerOpts = { ...DEFAULT_PURIFY_CONFIG, ...options };

  return localPurifier.sanitize(
    remove_extra_whitespace(html),
    sanitizerOpts
  ) as string;
};

export const remove_extra_whitespace = (str: string) =>
  str.replace(EXTRA_WHITESPACE_REGEX, '');
