import React from 'react';
import axios from 'axios';
import Head from 'next/head';

import ArticleView from '../components/ArticleView';
import ArticlesListView from '../components/ArticlesListView';
import { ArticleProps } from '../typings';
import { HomePageWrapper } from '../styles';
import { sortByDate } from '../util';

interface HomePageArticleState {
  articlesList: ArticleProps[] | null;
  viewingArticle: ArticleProps | null;
}

export default class HomePage extends React.Component<
  {},
  HomePageArticleState
> {
  state = {
    articlesList: null,
    viewingArticle: null,
  };

  componentDidMount = async () => {
    const { data } = await axios.get('http://localhost:3000/api/article/list');
    const { articlesList } = data as { articlesList: ArticleProps[] };

    this.setState({
      articlesList,
      viewingArticle: articlesList[0],
    });
  };

  handle_add_article = async (link: string) => {
    const { data } = await axios.put('http://localhost:3000/api/article/save', {
      url: link,
    });
    const { msg, article } = data as { msg: string; article: ArticleProps };

    if (msg === 'ok') {
      this.setState(state => ({
        articlesList: [...state.articlesList, article].sort((a, b) =>
          sortByDate(a.createdOn, b.createdOn)
        ),
        viewingArticle: article,
      }));
    }
  };

  handle_article_focus = (url: string) => {
    this.setState(state => ({
      viewingArticle: state.articlesList.find(article => article.url === url),
    }));
  };

  render = () => {
    return (
      <HomePageWrapper>
        <Head>
          <title>Home</title>
        </Head>
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
