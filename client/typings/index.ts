import { ParseResult } from '@postlight/mercury-parser';

export interface ArticleProps extends ParseResult {
  canonicalUrl: string;
  createdOn: string; // UTC
}
