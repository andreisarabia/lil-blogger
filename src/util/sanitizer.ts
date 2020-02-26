import createPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DEFAULT_PURIFY_CONFIG = { WHOLE_DOCUMENT: true };
const { window } = new JSDOM('');

export const sanitize = (str: string, options: createPurify.Config) => {
  const sanitizerOpts = { ...DEFAULT_PURIFY_CONFIG, ...options };

  return createPurify(window as any).sanitize(str, sanitizerOpts);
};
