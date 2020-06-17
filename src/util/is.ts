// helper fns for common JavaScript values/objects validation
import { isAlphanumeric } from './validators';

export const isStringArray = (strArr: string[] | any) =>
  Array.isArray(strArr) && strArr.every(el => typeof el === 'string');

export const isAlphanumericArray = (strArr: string[] | any) =>
  Array.isArray(strArr) &&
  strArr.every(el => typeof el === 'string' && isAlphanumeric(el));
