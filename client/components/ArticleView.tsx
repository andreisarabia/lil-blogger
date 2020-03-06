import React from 'react';
import styled from 'styled-components';

import { ArticleProps } from '../typings';

interface ArticleViewProps {
  focusedArticle: ArticleProps;
}

const ArticleViewSection = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;

  .article-view {
    padding: 1rem;
  }

  .moreInfo {
    display: flex;
    justify-content: space-around;
  }
`;

export default class ArticleView extends React.Component<ArticleViewProps> {
  constructor(props) {
    super(props);
  }

  render = () => {
    const { focusedArticle: article } = this.props;
    return (
      <ArticleViewSection>
        <h2>{article ? article.title : 'Fetching articles...'}</h2>
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
          dangerouslySetInnerHTML={{ __html: article ? article.content : '' }}
        />
      </ArticleViewSection>
    );
  };
}
