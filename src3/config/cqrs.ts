import { BaseCqrsEngine } from '../lib/cqrs/impl/base-cqrs-engine';
import { Store } from '../lib/cqrs/store';
import { command_handler } from '../lib/cqrs/types';
import { UserCommand } from '../models/user/user-command';
import { UserEvent } from '../models/user/user-event';
import { UserQuery, UserQueryHandler, UserResponse } from '../models/user/user-query';
import { store } from './values';

export type Command = UserCommand;
export type Event = UserEvent;
export type Query = UserQuery;
export type Response = UserResponse;
export type CommandHandler = command_handler<UserCommand, UserEvent>;
export type QueryHandler = UserQueryHandler;

export class AppCqrsEngine extends BaseCqrsEngine<Command, Event, Query, Response, CommandHandler, QueryHandler> {
  getEventStore(eventType: string): Store<any> {
    return store;
  }
}
