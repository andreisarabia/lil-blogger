import React from 'react';
import Header from '../components/Header';
import ArticleApp from '../components/ArticleApp';

export default class HomePage extends React.Component {
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
        <ArticleApp />
      </div>
    );
  }
}
