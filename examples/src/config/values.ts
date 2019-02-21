import {
  CommandRouterService,
  LocalstorageEventStore,
  NestCqrsClientStub,
  QueryRouterService,
} from 'cqrs-exp';
import { UserQuery, UserReadModel } from '../domain/user/user.query.type';
import { UserListReadModel } from '../domain/user/user-list.query.type';
import { UserCommand } from '../domain/user/user.command.type';
import { UserEvent } from '../domain/user/user.event.type';

export namespace config {
  export let host = 'localhost';
  export let port = 3000;
  export let baseUrl = 'http://' + host + ':' + port;
  export let eventStore = new LocalstorageEventStore('data');

  export let userReadModel = new UserReadModel(eventStore);
  export let userListReadModel = new UserListReadModel(eventStore);

  export let commandRouterService = new CommandRouterService([
    /* TODO */
  ]);
  export let queryRouterService = new QueryRouterService([
    userReadModel,
    userListReadModel,
  ]);
}
export let appClient = new NestCqrsClientStub(config.baseUrl);

export type AppCommand = UserCommand;
export type AppQuery = UserQuery;
export type AppEvent = UserEvent;
