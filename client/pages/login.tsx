import React from 'react';
import Router from 'next/router';
import axios from 'axios';

const MIN_PASSWORD_LENGTH = 15;
const MAX_PASSWORD_LENGTH = 45;

export default class LoginPage extends React.Component {
  state = {
    loginEmail: '',
    loginPassword: '',
    registerEmail: '',
    registerPassword: ''
  };

  handle_login = async () => {
    const { data } = await axios.post('/api/auth/login', {
      email: this.state.loginEmail,
      password: this.state.loginPassword
    });

    const { msg }: { msg: string } = data;

    if (msg === 'ok') Router.push('/');
  };

  handle_create_account = async () => {
    const { data } = await axios.post('/api/auth/register', {
      email: this.state.registerEmail,
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
          type='email'
          name='loginEmail'
          onChange={e => this.setState({ loginEmail: e.target.value.trim() })}
        />
        <input
          type='password'
          name='loginPassword'
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          onChange={e =>
            this.setState({ loginPassword: e.target.value.trim() })
          }
        />
        <button type='submit' onClick={this.handle_login}>
          Submit
        </button>

        <h2>Create an account</h2>

        <input
          type='email'
          name='registerEmail'
          onChange={e =>
            this.setState({ registerEmail: e.target.value.trim() })
          }
        />
        <input
          type='password'
          name='registerPassword'
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          onChange={e =>
            this.setState({ registerPassword: e.target.value.trim() })
          }
        />
        <button type='submit' onClick={this.handle_create_account}>
          Submit
        </button>
      </div>
    );
  };
}
