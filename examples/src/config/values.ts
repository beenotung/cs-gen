import { LocalstorageEventStore, NestCqrsClientStub } from 'cqrs-exp';
import { UserModel, UserQuery } from '../domain/user/user.query.type';
import { UserListModel } from '../domain/user/user-list.query.type';
import { UserCommand } from '../domain/user/user.command.type';
import { UserEvent } from '../domain/user/user.event.type';

export namespace config {
  export let host = 'localhost';
  export let port = 3000;
  export let baseUrl = 'http://' + host + ':' + port;
  export let eventStore = new LocalstorageEventStore('data');

  export let userModel = new UserModel();
  export let userListModel = new UserListModel();
}
export let appClient = new NestCqrsClientStub(config.baseUrl);

export type AppCommand = UserCommand;
export type AppQuery = UserQuery;
export type AppEvent = UserEvent;
