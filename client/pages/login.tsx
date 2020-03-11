import React from 'react';
import Router from 'next/router';
import axios from 'axios';
import Head from 'next/head';

const MIN_PASSWORD_LENGTH = 15;
const MAX_PASSWORD_LENGTH = 45;

export default class LoginPage extends React.Component {
  state = {
    loginEmail: '',
    loginPassword: '',
    registerEmail: '',
    registerPassword: '',
    loginError: '',
    registrationErrors: []
  };

  handle_login = async () => {
    try {
      const { data } = await axios.post('/api/auth/login', {
        email: this.state.loginEmail,
        password: this.state.loginPassword
      });

      const { msg }: { msg: string } = data;

      if (msg === 'ok') Router.push('/');
    } catch (error) {
      if (error?.response?.data?.error)
        this.setState({ loginError: error.response.data.error });
    }
  };

  handle_create_account = async () => {
    try {
      const { data } = await axios.post('/api/auth/register', {
        email: this.state.registerEmail,
        password: this.state.registerPassword
      });

      const { msg }: { msg: string } = data;

      if (msg === 'ok') Router.push('/');
    } catch (error) {
      if (error?.response?.data?.errors)
        this.setState({ registrationErrors: error.response.data.errors });
    }
  };

  render = () => {
    return (
      <div>
        <Head>Login</Head>

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

        {this.state.loginError && <p>{this.state.loginError}</p>}

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

        {this.state.registrationErrors.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {this.state.registrationErrors.map(err => (
              <p>{err}</p>
            ))}
          </div>
        )}
      </div>
    );
  };
}
