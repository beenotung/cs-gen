import { ICommand, IEvent, IQuery } from './data';
import { pos_int } from './type';

export interface IEventStore {
  saveEvents<E>(events: Array<IEvent<E>>): Promise<void>

  getEventsFor<E>(aggregate_id: string): Promise<Array<IEvent<E>>>

  /**
   * @param aggregate_id: id of the aggregate root
   * @param version: inclusive boundary
   * */
  getEventsForSince<E>(aggregate_id: string, version: pos_int): Promise<Array<IEvent<E>>>

  subscribeEventsFor<E>(aggregate_id: string, cb: (events: Array<IEvent<E>>) => void)

  /**
   * @param aggregate_id: id of the aggregate root
   * @param version: inclusive boundary
   * @param cb: callback function to consume events
   * */
  subscribeEventsForSince<E>(aggregate_id: string, version: pos_int, cb: (events: Array<IEvent<E>>) => void)
}

export interface ICqrsClient {
  sendCommand<C, T>(command: ICommand<C, T>): Promise<void>

  sendCommandAndGetEvents<C, T, E>(command: ICommand<C, T>): Promise<Array<IEvent<E>>>

  sendQuery<Q, R, T>(query: IQuery<Q, R, T>): Promise<R>
}

export interface ICqrsWriteServer {
  eventStore: IEventStore;

  handleCommand<C, T>(command: ICommand<C, T>): Promise<void>

  handleCommandAndGetEvents<C, T, E>(command: ICommand<C, T>): Promise<Array<IEvent<E>>>
}

export interface ICqrsReadServer {
  eventStore: IEventStore;

  handleEvents<E>(events: Array<IEvent<E>>): Promise<void>

  handleQuery<Q, R, T>(query: IQuery<Q, R, T>): Promise<R>
}

/**
 * a.k.a. event reducer
 * a.k.a. snapshot maker
 * a.k.a. aggregate maintainer
 * */
export interface IModel<A, E, T = string> {
  aggregate_type: T
  eventStore: IEventStore

  reduce(events: Array<IEvent<E>>, init: A): A
}
