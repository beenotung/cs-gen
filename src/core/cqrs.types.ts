import { ICommand, IEvent, INewEvent, IQuery } from './data';
import { CommonCommandResult, SaveEventResult } from './helper.types';
import { pos_int } from './type';

export interface IEventStore {
  saveEvents<E>(newEvents: Array<INewEvent<E>>): Promise<SaveEventResult>

  getEventsFor<E>(aggregate_id: string): Promise<Array<IEvent<E>>>

  /**
   * @param aggregate_id: id of the aggregate root
   * @param sinceVersion: inclusive boundary
   * */
  getEventsForSince<E>(aggregate_id: string, sinceVersion: pos_int): Promise<Array<IEvent<E>>>

  subscribeEventsFor<E>(aggregate_id: string, cb: (events: Array<IEvent<E>>) => void)

  /**
   * @param aggregate_id: id of the aggregate root
   * @param sinceVersion: inclusive boundary
   * @param cb: callback function to consume events
   * */
  subscribeEventsForSince<E>(aggregate_id: string, sinceVersion: pos_int, cb: (events: Array<IEvent<E>>) => void)
}

export interface ISince {
  type: 'version' | 'timestamp'
  since: pos_int
}

export interface ICommandResultWithEvents<R, E> {
  result: R
  events: Array<IEvent<E>>
}

export interface ICqrsClient {
  sendCommand<C, T, R = CommonCommandResult>(command: ICommand<C, T>): Promise<R>

  sendCommandAndGetEvents<C, T, E, R = CommonCommandResult>(command: ICommand<C, T>): Promise<ICommandResultWithEvents<R, E>>

  query<Q, R, T>(query: IQuery<Q, R, T>): Promise<R>

  /**
   * @param query
   * @param since: specify the minimum version of aggregates
   * */
  querySince<Q, R, T>(query: IQuery<Q, R, T>, since: ISince): Promise<R>
}

export interface ICqrsWriteServer {
  eventStore: IEventStore;

  handleCommand<C, T, R = CommonCommandResult>(command: ICommand<C, T>): Promise<R>

  handleCommandAndGetEvents<C, T, E, R = CommonCommandResult>(command: ICommand<C, T>): Promise<ICommandResultWithEvents<R, E>>
}

export interface ICqrsReadServer {
  eventStore: IEventStore;

  handleEvents<E>(events: Array<IEvent<E>>): Promise<void>

  handleQuery<Q, R, T>(query: IQuery<Q, R, T>): Promise<R>

  handleQuerySince<Q, R, T>(query: IQuery<Q, R, T>, since: ISince): Promise<R>
}

/**
 * a.k.a. event reducer
 * a.k.a. snapshot maker
 * a.k.a. aggregate maintainer
 * */
export interface IModel<A, E, T = string> {
  aggregate_type: T

  reduce(events: Array<IEvent<E>>, init: A): A
}
