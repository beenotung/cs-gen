import {
  CommandRouterService,
  LocalstorageEventStore,
  NestCqrsClientStub,
  QueryRouterService,
  CqrsService,
} from 'cqrs-exp';
import { UserQuery, UserReadModel } from '../domain/user1/user.query.type';
import { UserListReadModel } from '../domain/user1/user-list.query.type';
import { UserCommand } from '../domain/user1/user.command.type';
import { UserEvent } from '../domain/user1/user.event.type';

export namespace config {
  export let host = 'localhost';
  export let port = 3000;
  export let baseUrl = 'http://' + host + ':' + port;
  export let eventStore = new LocalstorageEventStore('data');

  export let userReadModel = new UserReadModel(eventStore);
  export let userListReadModel = new UserListReadModel(eventStore);

  export let cqrsService = new CqrsService(eventStore);

  cqrsService.attachWriteModel(user);
  cqrsService.attachReadModel(userReadModel, []);
}
export let appClient = new NestCqrsClientStub(config.baseUrl);

export type AppCommand = UserCommand;
export type AppQuery = UserQuery;
export type AppEvent = UserEvent;
