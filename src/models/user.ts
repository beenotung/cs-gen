import { domain } from '../lib/cqrs/models';
import { command, event, query, response } from '../lib/cqrs/types';
import { enum_values } from '@beenotung/tslib/enum';

export enum user_event_type {
  'CreatedUser' = 'CreatedUser',
}

export type user_event = event<never, never> & {
  type: user_event_type.CreatedUser,
  data: { username: string },
};

export enum user_command_type {
  'CreateUser' = 'CreateUser',
}

export type user_command = command<never, never> & {
  type: user_command_type.CreateUser,
  data: { username: string },
};

export enum user_query_type {
  'FindUserByUsername' = 'FindUserByUsername',
}

export type user_query = query<never, never> & {
  type: user_query_type.FindUserByUsername,
  data: { username: string },
};

export enum user_response_type {
  'UserProfile' = 'UserProfile',
}

export type user_response = response<never, never> & {
  type: user_response_type.UserProfile,
  data: { id: string, username: string },
};
export let user_event_handler = (event: user_event) => 'not impl';
export let user_command_handler = (command: user_command) => 'not impl';
export let user_query_handler = (query: user_query) => 'not impl';

export let userDomain: domain<user_event, user_command, user_query, user_response,
  user_event_type, user_command_type, user_query_type, user_response_type, typeof user_query_handler> = {
  name: 'UserDomain',
  event_types: enum_values(user_event_type),
  command_types: enum_values(user_command_type),
  event_handler: user_event_handler,
  command_handler: user_command_handler,
  query_handler: user_query_handler,
};
