import React from 'react';
import styled from 'styled-components';
import { ParseResult } from '@postlight/mercury-parser';

interface ArticleViewProps {
  focusedArticle: ParseResult;
}

const ArticleViewSection = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;

  .article-view {
    padding: 1rem;
  }
`;

export default class ArticleView extends React.Component<ArticleViewProps> {
  constructor(props) {
    super(props);
  }

  render() {
    const { focusedArticle: article } = this.props;
    return (
      <ArticleViewSection>
        <h3>{article ? article.title : 'Fetching articles...'}</h3>
        <div
          className='article-view'
          dangerouslySetInnerHTML={{ __html: article ? article.content : '' }}
        />
      </ArticleViewSection>
    );
  }
}
