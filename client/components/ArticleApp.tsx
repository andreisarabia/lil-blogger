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
  display: flex;
  justify-content: space-around;
  border-radius: 0.9rem;
  padding: 1rem 2rem;
  margin: auto;
  width: 75%;
  height: 100vh;
  background: #e5deee;
  border: 1px solid #918a8a;

  .article-section {
    flex: 0.5;
    font-size: 1.05rem;
  }

  .article-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }

  .article-list {
    width: 95%;
  }

  .article-list > p {
    border-bottom: 1px solid rebeccapurple;
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
        <section className='article-section'>
          <h2>Your Articles</h2>
          <input type='search' placeholder='Search articles here...' />
          <div className='article-list'>
            {this.props.articlesList.map(article => (
              <p
                key={article.url}
                onClick={e =>
                  this.setState(state => ({ viewingArticle: article }))
                }
              >
                {article.title}
              </p>
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
