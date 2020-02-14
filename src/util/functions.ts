const EXTRA_WHITESPACE_REGEX = /\s\s+/g;
const ALPHANUMERIC_REGEX = /^\w+$/g;

export const remove_extra_whitespace = (str: string): string =>
  str.replace(EXTRA_WHITESPACE_REGEX, '');

export const only_alphanumeric = (str: string): string =>
  str.replace(ALPHANUMERIC_REGEX, '');
