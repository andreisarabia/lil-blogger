import React from 'react';
import Header from '../components/Header';
import App from '../components/App'

export default class HomePage extends React.Component {
  render() {
    return (
      <div id='app-wrapper'>
        <Header />
        <App />
      </div>
    );
  }
}
