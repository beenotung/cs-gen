import { Drop } from '@beenotung/tslib/type';
import { pos_int, timestamp } from './type';

export interface IAggregate<T = string> {
  aggregate_id: string
  type: T
  version: pos_int
}

export interface IEvent<E> {
  aggregate_id: string
  version: pos_int
  timestamp: timestamp
  data: E
}

export type INewEvent<E> = Drop<IEvent<E>, 'version'> & Partial<IEvent<E>>;

export interface ISnapshot<A> {
  aggregate_id: string
  version: pos_int
  data: A
}

export interface ICommand<C, T = string> {
  type: T
  data: C
}

export interface IQuery<Q, R, T = string> {
  type: T
  session_id: string
  seq: pos_int
  query: Q
  response?: R
}
