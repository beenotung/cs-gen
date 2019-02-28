import { id, JsonValue, pos_int } from './util-types';
import { Drop } from '@beenotung/tslib/type';

export interface IAggregate<T extends id = any> {
  aggregate_id: id
  type: T
  version: number
  timestamp: number
}

/**
 * @property expected_version:  0 when expect the event to be new for the aggregate
 *                             >0 when expect the aggregate to be a specific version
 * */
export interface ICommand<C extends JsonValue = any, T extends id = any> {
  type: T
  command: C
  expected_version: 0 | pos_int
  timestamp: number
  command_id: id
}

export interface IEvent<E extends JsonValue = any, T extends id = any> {
  aggregate_id: id
  type: T
  event: E
  seq: pos_int
  timestamp: number
  from_command_id: id
}

/**
 * make seq field optional
 * */
export type INewEvent<Event extends IEvent<Event['event'], Event['type']> = any> =
  Drop<Event, 'seq'> & Partial<Event>;

export interface IQuery<Q extends JsonValue = any,
  R extends JsonValue = any,
  T extends id = any> {
  type: T
  query: Q
  response?: R
  minimum_version?: number
  minimum_timestamp?: number
}
