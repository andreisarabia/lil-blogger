const ALPHANUMERIC_REGEX = /^\w+$/g;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const SAFE_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/;
const VALID_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isAlphanumeric = (str: string) => ALPHANUMERIC_REGEX.test(str);

export const isEmail = (str: string) => EMAIL_REGEX.test(str);

export const isSafePassword = (str: string) => SAFE_PASSWORD_REGEX.test(str);

export const isValidUuid = (str: string) => VALID_UUID_REGEX.test(str);
