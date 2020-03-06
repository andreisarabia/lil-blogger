import React from 'react';
import Router from 'next/router';
import axios from 'axios';

export default class LoginPage extends React.Component {
  state = {
    loginUsername: '',
    loginPassword: '',
    registerUsername: '',
    registerPassword: ''
  };

  handle_login = async () => {
    const { data } = await axios.post('/api/auth/login', {
      username: this.state.loginUsername,
      password: this.state.loginPassword
    });

    const { msg }: { msg: string } = data;

    if (msg === 'ok') Router.push('/');
  };

  handle_create_account = async () => {
    const { data } = await axios.post('/api/auth/register', {
      username: this.state.registerUsername,
      password: this.state.registerPassword
    });

    const { msg }: { msg: string } = data;

    if (msg === 'ok') Router.push('/');
  };

  render = () => {
    return (
      <div>
        <h2>Login</h2>
        <input
          type='text'
          name='loginUsername'
          onChange={e => this.setState({ loginUsername: e.target.value })}
        />
        <input
          type='password'
          name='loginPassword'
          onChange={e => this.setState({ loginPassword: e.target.value })}
        />
        <button type='submit' onClick={this.handle_login}>
          Submit
        </button>

        <h2>Create an account</h2>

        <input
          type='text'
          name='registerUsername'
          onChange={e => this.setState({ username: e.target.value })}
        />
        <input
          type='password'
          name='registerPassword'
          onChange={e => this.setState({ password: e.target.value })}
        />
        <button type='submit' onClick={this.handle_create_account}>
          Submit
        </button>
      </div>
    );
  };
}
