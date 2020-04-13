import { ObjectId } from 'mongodb';
import { ParseResult } from '@postlight/mercury-parser';

export interface BaseProps {
  _id?: ObjectId;
}

export type QueryResults = {
  _id?: ObjectId;
  insertedId?: string;
  insertedCount?: number;
  ops: object[];
};

export interface ArticleProps extends BaseProps, ParseResult {
  canonicalUrl: string;
  createdOn: string; // UTC
  uniqueId: string;
  slug: string;
  userId: ObjectId;
  timeToFetch: number;
  timeToParse: number;
  sizeInBytes: number;
  tags: string[];
}

export type ArticlePropsKey = keyof ArticleProps;

export type ParsedArticleResult = Omit<ArticleProps, 'uniqueId' | 'tags'>;

export interface UserProps extends BaseProps {
  email: string;
  password: string;
  uniqueId: string;
  cookie: string;
}

export type UserPropsKey = keyof UserProps;
