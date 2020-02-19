import React from 'react';
import axios from 'axios';
import { ParseResult } from '@postlight/mercury-parser';

import Header from '../components/Header';
import ArticleApp from '../components/ArticleApp';

interface ArticlesData extends React.Props<any> {
  articlesData: ParseResult[];
}

export default class HomePage extends React.Component<ArticlesData> {
  constructor(props) {
    super(props);
    this.state = { linkToAdd: '' };
  }

  static async getInitialProps(ctx) {
    try {
      const { data } = await axios.get(
        'http://localhost:3000/api/article/list'
      );

      return data as ArticlesData;
    } catch (error) {
      return { articlesList: [] };
    }
  }

  render() {
    return (
      <div id='app-wrapper'>
        <style jsx global>{`
          body {
            margin: 0;
            background: #221431;
          }

          ul {
            list-style: none;
          }
        `}</style>
        <Header />
        <ArticleApp articlesList={this.props.articlesData} />
      </div>
    );
  }
}
