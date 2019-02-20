import {Drop} from '@beenotung/tslib/type';
import {CommonCommandResult} from './helper.types';
import {ID, JsonValue, pos_int, timestamp} from './type';

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

export type INewEvent<E extends JsonValue, T extends ID = string> =
  Drop<IEvent<E, T>, 'version'>
  & Partial<IEvent<E, T>>;

export interface ISnapshot<A extends JsonValue> {
  aggregate_id: string
  version: pos_int
  data: A
}

export interface ICommand<C extends JsonValue, R extends JsonValue = CommonCommandResult, T extends ID = string> {
  type: T
  command: C
  result: R
}

export interface ICommandResultWithEvents<R extends JsonValue, E extends JsonValue, T extends ID = string> {
  result: R
  events: Array<IEvent<E, T>>
}

export interface IQuery<Q extends JsonValue, R extends JsonValue, T extends ID = string> {
  type: T
  session_id: string
  seq: pos_int
  query: Q
  response?: R
}
