import { Component, Host, h, State } from '@stencil/core';
import { call } from '../../domain/api';

@Component({
  tag: 'demo-api',
  styleUrl: 'demo-api.css',
  shadow: true,
})
export class DemoApi {
  @State() username = '';

  createUser = () => {
    call({ Type: 'CreateUser', In: { username: this.username } });
  };

  checkUsername = () => {
    call({ Type: 'CheckUsername', In: { username: this.username } });
  };

  getAllUsernames = () => {
    call({ Type: 'GetAllUsernames', In: { username: this.username } });
  };

  render() {
    return (
      <Host>
        <h1>Demo API</h1>
        <label>username</label>
        <input value={this.username} onChange={e => (this.username = (e.target as HTMLInputElement).value)} />
        <label>actions</label>
        <button onClick={this.createUser}>create user</button>
        <button onClick={this.checkUsername}>check username</button>
        <button onClick={this.getAllUsernames}>get all usernames</button>
      </Host>
    );
  }
}
