import { ObjectID } from 'mongodb';
import { ParseResult } from '@postlight/mercury-parser';

export interface BaseProps {
  _id?: ObjectID;
}

export interface ArticleProps extends BaseProps, ParseResult {
  canonicalUrl: string;
  createdOn: string; // UTC
  uniqueId: string;
  slug: string;
  userId: ObjectID;
  timeToFetch: number;
  timeToParse: number;
}

export type ParsedArticleResult = Omit<ArticleProps, 'uniqueId'>;

export interface UserProps extends BaseProps {
  email: string;
  password: string;
  uniqueId: string;
  cookie: string;
}
