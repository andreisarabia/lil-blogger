import React from 'react';
import axios from 'axios';

export default class LoginPage extends React.Component {
  state = {
    username: '',
    password: ''
  };

  handle_login = async () => {
    const { data } = await axios.post('/api/auth/login', {
      username: this.state.username,
      password: this.state.password
    });

    console.log(data);
  };

  render = () => {
    return (
      <div>
        <h2>Login</h2>
        <input
          type='text'
          name='username'
          onChange={e => this.setState({ username: e.target.value })}
        />
        <input
          type='password'
          name='password'
          onChange={e => this.setState({ password: e.target.value })}
        />
        <button type='submit' onClick={this.handle_login}>
          Submit
        </button>
      </div>
    );
  };
}
