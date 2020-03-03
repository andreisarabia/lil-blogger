import React from 'react';
import styled from 'styled-components';
import axios from 'axios';

import ArticleView from '../components/ArticleView';
import ArticlesListView from '../components/ArticlesListView';
import { ArticleProps } from '../typings';

interface HomePageArticleState {
  articlesList: ArticleProps[];
  viewingArticle: ArticleProps;
}

const HomePageWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  border-radius: 0.9rem;
  padding: 1rem 2rem;
  margin: auto;
  width: 90%;
  height: 97.5%;
  background: #e5deee;
  border: 1px solid #918a8a;
`;

const sort_by_date = (firstArticle, secondArticle) => {
  const aMilleseconds = new Date(firstArticle.createdOn).getMilliseconds();
  const bMilleseconds = new Date(secondArticle.createdOn).getMilliseconds();

  if (aMilleseconds > bMilleseconds) return 1;
  if (aMilleseconds < bMilleseconds) return -1;
  return 0;
};

export default class HomePage extends React.Component<
  {},
  HomePageArticleState
> {
  constructor(props) {
    super(props);

    this.state = {
      articlesList: [],
      viewingArticle: null
    };
  }

  componentDidMount = async () => {
    const { data } = await axios.get('http://localhost:3000/api/article/list');
    const { articlesList } = data as { articlesList: ArticleProps[] };

    this.setState({
      articlesList,
      viewingArticle: articlesList[0]
    });
  };

  handle_add_article = async (link: string) => {
    const { data } = await axios.put('http://localhost:3000/api/article/save', {
      url: link
    });
    const { msg, article } = data as { msg: string; article: ArticleProps };

    if (msg === 'ok') {
      this.setState(state => ({
        articlesList: [...state.articlesList, article].sort(sort_by_date),
        viewingArticle: article
      }));
    }
  };

  handle_article_focus = (url: string) => {
    this.setState(state => ({
      viewingArticle: state.articlesList.find(article => article.url === url)
    }));
  };

  render = () => {
    return (
      <HomePageWrapper>
        <ArticlesListView
          list={this.state.articlesList}
          onArticleAdd={this.handle_add_article}
          onArticleFocus={this.handle_article_focus}
        />
        <ArticleView focusedArticle={this.state.viewingArticle} />
      </HomePageWrapper>
    );
  };
}
