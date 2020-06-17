import React from 'react';

import { ArticleProps } from '../typings';
import { ArticleViewSection } from '../styles';

interface ArticleViewProps {
  focusedArticle: ArticleProps;
}

export default class ArticleView extends React.Component<ArticleViewProps> {
  constructor(props: ArticleViewProps) {
    super(props);
  }

  render = () => {
    const { focusedArticle: article } = this.props;

    return (
      <ArticleViewSection>
        <h2>{article ? article.title : ''}</h2>
        <div className='moreInfo'>
          {article && article.date_published && (
            <h4>
              Date Published {new Date(article.date_published).toLocaleString()}
            </h4>
          )}
          {article && article.createdOn && (
            <h4>Added on: {new Date(article.createdOn).toLocaleString()}</h4>
          )}
        </div>
        <div className='authors'>
          {article && article.author && <h4>{article.author}</h4>}
        </div>
        {article && article.excerpt && (
          <p>{article.excerpt.replace('&hellip;', '...')}</p>
        )}
        <div
          className='article-view'
          dangerouslySetInnerHTML={{
            __html: article ? (article.content as string) : '',
          }}
        />
      </ArticleViewSection>
    );
  };
}
