import React from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { ParseResult } from '@postlight/mercury-parser';

interface ArticlesState {
  articles: ParseResult[];
  viewingArticle: ParseResult;
  showAddArticleInput: boolean;
  articleToAdd: string;
}

type ArticlesListResponseData = {
  articlesList: ParseResult[];
};

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

export default class ArticleApp extends React.Component<{}, ArticlesState> {
  constructor(props) {
    super(props);

    this.state = {
      viewingArticle: null,
      showAddArticleInput: false,
      articleToAdd: '',
      articles: []
    };
  }

  async componentDidMount() {
    const { data } = await axios.get('http://localhost:3000/api/article/list');
    const { articlesList } = data as ArticlesListResponseData;
    const sortedArticlesList = articlesList.reverse();

    this.setState({
      articles: sortedArticlesList,
      viewingArticle: sortedArticlesList[0]
    });
  }

  private async handle_add_article(e: React.MouseEvent) {
    try {
      const params = { url: this.state.articleToAdd };
      const { data } = await axios.put(
        'http://localhost:3000/api/article/save',
        params
      );
      console.log(data);

      const { msg, article } = data as { msg: string; article: ParseResult };

      if (msg === 'ok') {
        this.setState({ articles: this.state.articles.concat(article) });
      }
    } catch (error) {
      console.log(error);
    } finally {
      console.log(this.state.articleToAdd);
      this.setState({ articleToAdd: '' });
    }
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
    const articleSearchStyle = {
      display: !this.state.showAddArticleInput ? 'block' : 'none'
    };
    const articleAddStyle = {
      display: this.state.showAddArticleInput ? 'block' : 'none'
    };

    return (
      <MainSection>
        <section className='article-section'>
          <div className='add-article-header'>
            <h2>Your Articles</h2>
            <button onClick={() => this.toggle_add_article_input()}>+</button>
          </div>

          <form
            className='article-inputs'
            onSubmit={e => e.preventDefault()}
            style={{ display: 'flex' }}
          >
            <input
              type='search'
              placeholder='Search articles here...'
              style={articleSearchStyle}
            />
            <input
              type='text'
              placeholder='Add article link'
              style={articleAddStyle}
              value={this.state.articleToAdd}
              onChange={e => this.setState({ articleToAdd: e.target.value })}
            />
            <input
              type='submit'
              value='Add'
              style={articleAddStyle}
              onClick={e => this.handle_add_article(e)}
            />
          </form>

          <div className='article-list'>
            {this.state.articles.length > 0 &&
              this.state.articles.map(article => (
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
          <h3>
            {this.state.viewingArticle
              ? this.state.viewingArticle.title
              : 'Fetching articles...'}
          </h3>
          <div
            dangerouslySetInnerHTML={{
              __html: this.state.viewingArticle
                ? this.state.viewingArticle.content
                : null
            }}
          />
        </section>
      </MainSection>
    );
  }
}
