import { Component, h, Host, State, Watch } from '@stencil/core';
import { call } from '../../domain/api';
import { CheckUsername, GetAllUsernames } from '../../domain/calls';

@Component({
  tag: 'demo-api',
  styleUrl: 'demo-api.css',
  shadow: true,
})
export class DemoApi {
  @State() username = '';
  @State() allUsernames?: string[];
  @State() hasUsed?: boolean;
  @State() out?: any;
  @State() err?: any;

  @Watch('username')
  reset() {
    this.hasUsed = undefined;
  }

  call<T extends Promise<any>>(p: T) {
    p.then(out => {
      this.out = out;
      this.hasUsed = undefined;
    }).catch(err => (this.err = err));
    return p;
  }

  createUser = () => {
    this.call(call('CreateUser', { username: this.username }));
  };

  checkUsername = () => {
    this.call(
      call<CheckUsername>('CheckUsername', { username: this.username }),
    ).then(out => {
      this.hasUsed = out.used;
    });
  };

  getAllUsernames = () => {
    this.call(call<GetAllUsernames>('GetAllUsernames', {})).then(out => {
      this.allUsernames = out.usernames;
    });
  };

  render() {
    return (
      <Host>
        <h1>Demo API</h1>
        <label>username</label>
        <input value={this.username} onChange={e => (this.username = (e.target as HTMLInputElement).value)} />
        <span class="used" hidden={typeof this.hasUsed !== 'boolean'}>
          {this.hasUsed === true ? 'used' : this.hasUsed === false ? 'not used' : undefined}
        </span>
        <label>actions</label>
        <button onClick={this.createUser}>create user</button>
        <button onClick={this.checkUsername} disabled={typeof this.hasUsed === 'boolean'}>
          check username
        </button>
        <button onClick={this.getAllUsernames}>get all usernames</button>
        {this.out
          ? [
              <label>output</label>,
              <pre>
                <code>{JSON.stringify(this.out, null, 2)}</code>
              </pre>,
            ]
          : undefined}
        {this.err
          ? [
              <label>error</label>,
              <pre>
                <code>{this.err}</code>
              </pre>,
            ]
          : undefined}
        {this.allUsernames ? (
          <ol>
            {this.allUsernames.map(username => (
              <li>{username}</li>
            ))}
          </ol>
        ) : undefined}
      </Host>
    );
  }
}
