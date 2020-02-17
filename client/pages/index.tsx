import React from 'react';
import axios from 'axios';
import { ParseResult } from '@postlight/mercury-parser';
import Header from '../components/Header';
import ArticleApp from '../components/ArticleApp';

interface ParsedArticle {
  name: string;
}

export default class HomePage extends React.Component<ParsedArticle> {
  constructor(props) {
    super(props);
  }

  static async getInitialProps(ctx) {
    const { data } = await axios.get('http://localhost:3000/api/article/list');

    return { data };
  }

  render() {
    console.log(this.props);
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
        <ArticleApp name={this.props.name} />
      </div>
    );
  }
}
