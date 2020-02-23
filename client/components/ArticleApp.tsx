import React from 'react';
import styled from 'styled-components';
import { ParseResult } from '@postlight/mercury-parser';

export interface ParsedArticle extends React.Props<any> {
  articlesList: ParseResult[];
}

interface ArticlesState {
  viewingArticle: ParseResult;
  showAddArticleInput: boolean;
  articleToAdd: string;
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

  .add-article-header {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .add-article-header > button {
    padding: 0.25rem;
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
      viewingArticle: this.props.articlesList[0],
      showAddArticleInput: false,
      articleToAdd: ''
    };
  }

  private update_viewing_article(article: ParseResult) {
    this.setState({ viewingArticle: article });
  }

  private toggle_add_article_input() {
    this.setState(state => ({
      showAddArticleInput: !state.showAddArticleInput
    }));
  }

  render() {
    const articleHtml = { __html: this.state.viewingArticle.content };

    return (
      <MainSection>
        <section className='article-section'>
          <div className='add-article-header'>
            <h2>Your Articles</h2>
            <button onClick={() => this.toggle_add_article_input()}>+</button>
          </div>

          <form className='article-inputs' onSubmit={e => e.preventDefault()}>
            <input
              type='search'
              placeholder='Search articles here...'
              style={{
                display: !this.state.showAddArticleInput ? 'block' : 'none'
              }}
            />
            <input
              type='text'
              placeholder='Add article link'
              style={{
                display: this.state.showAddArticleInput ? 'block' : 'none'
              }}
              onChange={e => this.setState({ articleToAdd: e.target.value })}
            />
          </form>

          <div className='article-list'>
            {this.props.articlesList.map(article => (
              <p
                key={article.url}
                onClick={() => this.update_viewing_article(article)}
              >
                {article.title}
              </p>
            ))}
          </div>
        </section>
        <section className='article-view'>
          <h3>{this.state.viewingArticle.title}</h3>
          <div dangerouslySetInnerHTML={articleHtml} />
        </section>
      </MainSection>
    );
  }
}
