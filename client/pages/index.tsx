import React from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { ParseResult } from '@postlight/mercury-parser';

import ArticleView from '../components/ArticleView';
import ArticlesListView from '../components/ArticlesListView';

interface HomePageArticleState {
  articlesList: ParseResult[];
  viewingArticle: ParseResult;
}

const HomePageWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  border-radius: 0.9rem;
  padding: 1rem 2rem;
  margin: auto;
  width: 90%;
  height: 100vh;
  background: #e5deee;
  border: 1px solid #918a8a;
`;

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

  handle_add_article = async (link: string) => {
    const { data } = await axios.put('http://localhost:3000/api/article/save', {
      url: link
    });
    const { msg, article } = data as { msg: string; article: ParseResult };

    if (msg === 'ok') {
      this.setState(state => ({
        articlesList: [...state.articlesList, article]
      }));
    }
  };

  handle_article_focus = (url: string) => {
    this.setState(state => ({
      viewingArticle: state.articlesList.find(article => article.url === url)
    }));
  };

  componentDidMount = async () => {
    const { data } = await axios.get('http://localhost:3000/api/article/list');
    const { articlesList } = data as { articlesList: ParseResult[] };
    const sortedArticlesList = articlesList.reverse();

    this.setState({
      articlesList: sortedArticlesList,
      viewingArticle: sortedArticlesList[0]
    });
  };

  render() {
    return (
      <HomePageWrapper>
        <style jsx global>{`
          body {
            margin: 0;
            background: #e5e1ea;
          }

          ul {
            list-style: none;
          }
        `}</style>
        <ArticlesListView
          list={this.state.articlesList}
          onArticleAdd={this.handle_add_article}
          onArticleFocus={this.handle_article_focus}
        />
        <ArticleView focusedArticle={this.state.viewingArticle} />
      </HomePageWrapper>
    );
  }
}
