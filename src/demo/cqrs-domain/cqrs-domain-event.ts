import { ICommand, IEvent, IQuery } from '../core/data-types';
import { JsonValue } from '../core/util-types';

export type CqrsServerAggregateId = 'cqrs-server';
export let CqrsServerAggregateId: CqrsServerAggregateId = 'cqrs-server';

export type UnknownCommandReceived =
  IEvent<ICommand & JsonValue, 'UnknownCommandReceived'>
  & { aggregate_id: CqrsServerAggregateId };

export type CommandHandlingFailed =
  IEvent<{ command: ICommand, error_message: string } & JsonValue, 'CommandHandlingFailed'>
  & { aggregate_id: CqrsServerAggregateId };

export type UnknownQueryReceived =
  IEvent<IQuery & JsonValue, 'UnknownQueryReceived'>
  // & { from_command_id: never }
  & { aggregate_id: CqrsServerAggregateId };

export type CqrsDomainEvent = UnknownCommandReceived
  | CommandHandlingFailed
  | UnknownQueryReceived
  ;
