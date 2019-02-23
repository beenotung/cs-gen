import { Drop } from '@beenotung/tslib/type';
import { CommonCommandResult } from './helper.types';
import { ID, JsonValue, pos_int, timestamp } from './type';

export interface IAggregate<T extends ID = string> {
  aggregate_id: string
  type: T
  version: pos_int
}

export interface IEvent<E extends JsonValue, T extends ID = string> {
  aggregate_id: string
  type: T
  version: pos_int
  timestamp: timestamp
  data: E
}

export type INewEvent<Event extends IEvent<Event['data'], Event['type']>> =
  Drop<Event, 'version'>
  & Partial<Event>
  ;

export interface ISnapshot<A extends JsonValue> {
  aggregate_id: string
  version: pos_int
  data: A
}

export interface ICommand<C extends JsonValue, R extends CommonCommandResult<Event>,
  Event extends IEvent<Event['data'], Event['type']>, T extends ID = string> {
  type: T
  command: C
  result: R
  events: Event[]
}

export interface IQuery<Q extends JsonValue, R extends JsonValue, T extends ID = string> {
  type: T
  session_id: string
  seq: pos_int
  query: Q
  response?: R
}
