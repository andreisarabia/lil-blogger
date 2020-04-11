const EXTRA_WHITESPACE_REGEX = /\s\s+/g;
const ALPHANUMERIC_REGEX = /^\w+$/g;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const SAFE_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/;

export const isAlphanumeric = (str: string) => ALPHANUMERIC_REGEX.test(str);

export const isEmail = (str: string) => EMAIL_REGEX.test(str);

export const isSafePassword = (str: string) => SAFE_PASSWORD_REGEX.test(str);
