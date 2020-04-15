import { ObjectId } from 'mongodb';
import { ParseResult } from '@postlight/mercury-parser';

export interface BaseProps {
  _id?: ObjectId;
}

export interface ArticleProps extends BaseProps, ParseResult {
  canonicalUrl: string;
  createdOn: string; // UTC
  uniqueId: string;
  slug: string;
  userId: ObjectId;
  timeToFetch: number;
  timeToParse: number;
  sizeInBytes: number;
  tags: string[] | string;
}

export type ParsedArticleResult = Omit<ArticleProps, 'uniqueId' | 'tags'>;

export interface UserProps extends BaseProps {
  email: string;
  password: string;
  uniqueId: string;
  cookie: string;
}
