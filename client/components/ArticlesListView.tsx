import React from 'react';
import styled from 'styled-components';

import { ArticleProps } from '../typings';

interface ArticlesListViewProps {
  list: ArticleProps[];
  onArticleAdd: (link: string) => void;
  onArticleFocus: (link: string) => void;
}

interface ArticlesListViewState {
  showAddArticleInput: boolean;
  articleLinkToAdd: string;
}

const ArticleListSection = styled.section`
  flex: 0.5;
  font-size: 1.05rem;
  overflow: auto;

  h2 {
    align-self: flex-start;
    margin-left: 2rem;
  }

  .add-article-header {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .add-article-header > button {
    padding: 0.25rem;
  }

  .article-list {
    width: 95%;
  }

  .article-list > p {
    border-bottom: 1px solid rebeccapurple;
  }
`;

export default class ArticlesListView extends React.Component<
  ArticlesListViewProps,
  ArticlesListViewState
> {
  state = {
    showAddArticleInput: false,
    articleLinkToAdd: ''
  };

  constructor(props) {
    super(props);
  }

  toggle_article_input = () => {
    this.setState(state => ({
      showAddArticleInput: !state.showAddArticleInput
    }));
  };

  handle_add_article_click = () => {
    this.props.onArticleAdd(this.state.articleLinkToAdd);
    this.setState({ articleLinkToAdd: '' });
  };

  render = () => {
    const articleSearchStyle = {
      display: this.state.showAddArticleInput ? 'none' : 'block'
    };
    const articleAddStyle = {
      display: this.state.showAddArticleInput ? 'block' : 'none'
    };

    return (
      <ArticleListSection>
        <div className='add-article-header'>
          <h2>Your Articles</h2>
          <button onClick={this.toggle_article_input}>+</button>
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
            defaultValue={''}
            onChange={e => this.setState({ articleLinkToAdd: e.target.value })}
          />
          <input
            type='submit'
            value='Add'
            style={articleAddStyle}
            onClick={this.handle_add_article_click}
          />
        </form>

        <div className='article-list'>
          {this.props.list.map(({ title, url }) => (
            <p key={url} onClick={() => this.props.onArticleFocus(url)}>
              {title}
            </p>
          ))}
        </div>
      </ArticleListSection>
    );
  };
}
