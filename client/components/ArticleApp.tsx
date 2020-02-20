import React from 'react';
import styled from 'styled-components';
import { ParseResult } from '@postlight/mercury-parser';

interface ParsedArticle extends React.Props<any> {
  articlesList: ParseResult[];
}

const MainSection = styled.main`
  background: #352448;
  color: white;
  display: flex;
  justify-content: space-around;
  border-radius: 0.9rem;
  margin: auto;
  width: 75%;
  min-height: 70vh;
  max-height: 95vh;

  .article-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0.5;
  }

  .article-view {
    flex: 1;
  }

  h2 {
    align-self: flex-start;
    margin-left: 2rem;
  }
`;

export default class ArticleApp extends React.Component<ParsedArticle, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <MainSection>
        <section className='article-list'>
          <h2>Your Articles</h2>
          <input type='search' placeholder='Search articles here...' />
          <div className='articleList'>
            {this.props.articlesList.map(article => (
              <p key={article.url}>{article.title}</p>
            ))}
          </div>
        </section>
        <section className='article-view'></section>
      </MainSection>
    );
  }
}
