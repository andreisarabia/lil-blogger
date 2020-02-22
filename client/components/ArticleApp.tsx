import React from 'react';
import styled from 'styled-components';
import { ParseResult } from '@postlight/mercury-parser';

export interface ParsedArticle extends React.Props<any> {
  articlesList: ParseResult[];
}

interface ArticlesState {
  viewingArticle: ParseResult;
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
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }

  h2 {
    align-self: flex-start;
    margin-left: 2rem;
  }
`;

export default class ArticleApp extends React.Component<
  ParsedArticle,
  ArticlesState
> {
  constructor(props) {
    super(props);

    this.state = {
      viewingArticle: this.props.articlesList[0]
    };
  }

  render() {
    return (
      <MainSection>
        <section className='article-list'>
          <h2>Your Articles</h2>
          <input type='search' placeholder='Search articles here...' />
          <div className='articleList'>
            {this.props.articlesList &&
              this.props.articlesList.map(article => (
                <p key={article.url}>{article.title}</p>
              ))}
          </div>
        </section>
        <section className='article-view'>
          <h3>{this.state.viewingArticle.title}</h3>
          <div
            dangerouslySetInnerHTML={{
              __html: this.state.viewingArticle.content
            }}
          />
        </section>
      </MainSection>
    );
  }
}
