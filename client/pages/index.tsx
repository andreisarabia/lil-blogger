import React from 'react';
import axios from 'axios';

import ArticleApp from '../components/ArticleApp';

export default class HomePage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id='app-wrapper'>
        <style jsx global>{`
          body {
            margin: 0;
            background: #e5e1ea;
          }

          ul {
            list-style: none;
          }
        `}</style>
        <ArticleApp />
      </div>
    );
  }
}
