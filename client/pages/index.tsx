import React from 'react';
import axios from 'axios';

import Header from '../components/Header';
import ArticleApp, { ParsedArticle } from '../components/ArticleApp';

export default class HomePage extends React.Component<ParsedArticle> {
  constructor(props) {
    super(props);
    this.state = { linkToAdd: '' };
  }

  static async getInitialProps(ctx) {
    try {
      const { data } = await axios.get(
        'http://localhost:3000/api/article/list'
      );

      return data as ParsedArticle;
    } catch (error) {
      console.log(error);

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
        <ArticleApp articlesList={this.props.articlesList} />
      </div>
    );
  }
}
