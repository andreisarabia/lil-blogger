import React from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { ParseResult } from '@postlight/mercury-parser';

export interface ParsedArticle extends React.Props<any> {
  articleList?: ParseResult[];
}

const MainSection = styled.main`
  background: #352448;
  color: white;
  display: flex;
  justify-content: space-around;
  border-radius: 0.9rem;
  margin: auto;
  width: 75%;

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

  static async getInitialProps(ctx) {
    try {
      const { data } = await axios.get(
        'http://localhost:3000/api/article/list'
      );

      return { articleList: data } as ParsedArticle;
    } catch (error) {
      return { data: null };
    }
  }

  render() {
    return (
      <MainSection>
        <section className='article-list'>
          <h2>Your Articles</h2>
          <input type='search' placeholder='Search articles here...' />
          <div className='articles'>{this.props.articleList}</div>
        </section>
        <section className='article-view'></section>
      </MainSection>
    );
  }
}
