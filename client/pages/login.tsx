import React from 'react';
import Router from 'next/router';
import axios from 'axios';
import Head from 'next/head';

import { LoginForm } from '../styles';

const MIN_PASSWORD_LENGTH = 15;
const MAX_PASSWORD_LENGTH = 45;

export default class LoginPage extends React.Component {
  state = {
    loginEmail: '',
    loginPassword: '',
    registerEmail: '',
    registerPassword: '',
    loginError: '',
    registrationErrors: [],
    showLoginForm: true,
  };

  handleLogin = async () => {
    try {
      const { data } = await axios.post('/api/auth/login', {
        email: this.state.loginEmail,
        password: this.state.loginPassword,
      });

      const { msg }: { msg: string } = data;

      if (msg === 'ok') Router.push('/');
    } catch (error) {
      if (error?.response?.data?.error)
        this.setState({ loginError: error.response.data.error });
    }
  };

  handleCreateAccount = async () => {
    try {
      const { data } = await axios.post('/api/auth/register', {
        email: this.state.registerEmail,
        password: this.state.registerPassword,
      });

      const { msg }: { msg: string } = data;

      if (msg === 'ok') Router.push('/');
    } catch (error) {
      if (error?.response?.data?.errors)
        this.setState({ registrationErrors: error.response.data.errors });
    }
  };

  checkSecondPassword = (secondPwd: string) => {
    if (this.state.registerPassword !== secondPwd) {
      console.error('Wrong!');
    }
  };

  render = () => {
    return (
      <LoginForm>
        <Head>Login</Head>

        <section
          id='login'
          style={{ display: this.state.showLoginForm ? 'inherit' : 'none' }}
        >
          <h2>Login</h2>

          <div id='login-info'>
            <input
              type='email'
              name='loginEmail'
              placeholder='Email'
              onChange={e =>
                this.setState({ loginEmail: e.target.value.trim() })
              }
            />
            <input
              type='password'
              name='loginPassword'
              placeholder='Password'
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              onChange={e =>
                this.setState({ loginPassword: e.target.value.trim() })
              }
            />

            <p>
              New? Click
              <span
                style={{ color: 'blue', cursor: 'pointer' }}
                onClick={() => {
                  this.setState({ showLoginForm: false });
                }}
              >
                {' '}
                here
              </span>{' '}
              to register
            </p>

            <button type='submit' onClick={this.handleLogin}>
              Submit
            </button>

            {this.state.loginError && <p>{this.state.loginError}</p>}
          </div>
        </section>

        <section
          id='register'
          style={{ display: this.state.showLoginForm ? 'none' : 'inherit' }}
        >
          <h2>Create an account</h2>

          <div id='registration-info'>
            <input
              type='email'
              name='registerEmail'
              placeholder='Email'
              onChange={e =>
                this.setState({ registerEmail: e.target.value.trim() })
              }
            />
            <input
              type='password'
              name='registerPassword'
              placeholder='Password'
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              onChange={e =>
                this.setState({ registerPassword: e.target.value.trim() })
              }
            />
            <input
              type='password'
              name='loginPassword2'
              placeholder='Retype your password'
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              onChange={e => this.checkSecondPassword(e.target.value)}
              onBlur={e => this.checkSecondPassword(e.target.value)}
            />

            <p>
              Click{' '}
              <span
                style={{ color: 'blue', cursor: 'pointer' }}
                onClick={() => {
                  this.setState({ showLoginForm: true });
                }}
              >
                here
              </span>{' '}
              to get back to the login form
            </p>

            <button type='submit' onClick={this.handleCreateAccount}>
              Submit
            </button>
          </div>

          {this.state.registrationErrors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {this.state.registrationErrors.map(err => (
                <p>{err}</p>
              ))}
            </div>
          )}
        </section>
      </LoginForm>
    );
  };
}
