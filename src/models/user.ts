import { enum_values } from '@beenotung/tslib/enum';
import { not_impl } from '@beenotung/tslib/error';
import { Rethinkdb } from '../lib/cqrs/impl/rethinkdb';
import { RethinkdbDomain } from '../lib/cqrs/impl/rethinkdb-domain';
import {
  command,
  command_handler,
  event,
  event_handler,
  query,
  response,
} from '../lib/cqrs/types';

export enum user_event_type {
  'CreatedUser' = 'CreatedUser',
}

export type user_event = event<never, never> & {
  type: user_event_type.CreatedUser;
  data: { username: string };
};

export enum user_command_type {
  'CreateUser' = 'CreateUser',
}

export type user_command = command<never, never> & {
  type: user_command_type.CreateUser;
  data: { username: string };
};

export enum user_query_type {
  'FindUserByUsername' = 'FindUserByUsername',
}

export type user_query = query<never, never> & {
  type: user_query_type.FindUserByUsername;
  data: { username: string };
};

export enum user_response_type {
  'UserProfile' = 'UserProfile',
}

export type user_response = response<never, never> & {
  type: user_response_type.UserProfile;
  data: { id: string; username: string };
};

export type user_query_handler = (
  query: query<{ username: string }, user_query_type.FindUserByUsername>,
) => Promise<
  response<{ id: string; username: string }, user_response_type.UserProfile>
>;

export class UserDomain extends RethinkdbDomain<
  user_event,
  user_command,
  user_query,
  user_response,
  user_event_type,
  user_command_type,
  user_query_type,
  user_response_type,
  user_query_handler
> {
  name: string;

  event_types: user_event_type[];
  command_types: user_command_type[];
  query_types: user_query_type[];

  event_handler: event_handler<user_event, user_event_type>;
  command_handler: command_handler<
    user_command,
    user_event,
    user_command_type,
    user_event_type
  >;
  query_handler: user_query_handler;

  constructor(rethinkdb: Rethinkdb) {
    super(rethinkdb);
    this.name = 'UserModel';

    this.event_types = enum_values(user_event_type);
    this.command_types = enum_values(user_command_type);
    this.query_types = enum_values(user_query_type);

    this.event_handler = async event => {
      return not_impl();
    };
    this.command_handler = command => {
      return 'not_impl';
    };
    this.query_handler = async query => {
      return 'not_impl';
    };
  }
}
