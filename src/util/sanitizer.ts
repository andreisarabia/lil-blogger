import createPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DEFAULT_PURIFY_CONFIG = { WHOLE_DOCUMENT: true };
const localPurifier = createPurify(new JSDOM('').window as any);

export const sanitize = (html: string, options: createPurify.Config = {}) => {
  const sanitizerOpts = { ...DEFAULT_PURIFY_CONFIG, ...options };

  return localPurifier.sanitize(html, sanitizerOpts) as string;
};
