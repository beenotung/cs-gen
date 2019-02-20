import { ICommand, ICommandResultWithEvents, IEvent, INewEvent, IQuery } from './data';
import { CommonCommandResult, SaveEventResult } from './helper.types';
import { ID, JsonValue, pos_int } from './type';

export interface IEventStore {
  saveEvents<E extends JsonValue, T extends ID>(newEvents: Array<INewEvent<E, T>>): Promise<SaveEventResult>

  getEventsFor<E extends JsonValue, T extends ID>(aggregate_id: string): Promise<Array<IEvent<E, T>>>

  /**
   * @param aggregate_id: id of the aggregate root
   * @param sinceVersion: inclusive boundary
   * */
  getEventsForSince<E extends JsonValue, T extends ID>(aggregate_id: string, sinceVersion: pos_int): Promise<Array<IEvent<E, T>>>

  subscribeEventsFor<E extends JsonValue, T extends ID>(aggregate_id: string, cb: (events: Array<IEvent<E, T>>) => void)

  /**
   * @param aggregate_id: id of the aggregate root
   * @param sinceVersion: inclusive boundary
   * @param cb: callback function to consume events
   * */
  subscribeEventsForSince<E extends JsonValue, T extends ID>
  (aggregate_id: string, sinceVersion: pos_int, cb: (events: Array<IEvent<E, T>>) => void)
}

export interface ISince {
  type: 'version' | 'timestamp'
  since: pos_int
}

export interface ICqrsClient<C extends JsonValue, CT extends ID,
  E extends JsonValue, ET extends ID,
  Q extends JsonValue, QT extends ID,
  R extends JsonValue = CommonCommandResult> {
  sendCommand(command: ICommand<C, CT>): Promise<R>

  sendCommandAndGetEvents(command: ICommand<C, CT>): Promise<ICommandResultWithEvents<R, E, ET>>

  query(query: IQuery<Q, R, QT>): Promise<R>

  /**
   * @param query
   * @param since: specify the minimum version of aggregates
   * */
  querySince<Q extends JsonValue, R extends JsonValue, T extends ID>(query: IQuery<Q, R, T>, since: ISince): Promise<R>
}

export interface ICqrsWriteServer {
  eventStore: IEventStore;

  handleCommand<C extends JsonValue, T extends ID, R extends JsonValue = CommonCommandResult>(command: ICommand<C, T>): Promise<R>

  handleCommandAndGetEvents<C extends JsonValue, CT extends ID,
    E extends JsonValue, ET extends ID,
    R extends JsonValue = CommonCommandResult>
  (command: ICommand<C, CT>): Promise<ICommandResultWithEvents<R, E, ET>>
}

export interface ICqrsReadServer {
  eventStore: IEventStore;

  handleEvents<E extends JsonValue, T extends ID>(events: Array<IEvent<E, T>>): Promise<void>

  handleQuery<Q extends JsonValue, R extends JsonValue, T extends ID>(query: IQuery<Q, R, T>): Promise<R>

  handleQuerySince<Q extends JsonValue, R extends JsonValue, T extends ID>(query: IQuery<Q, R, T>, since: ISince): Promise<R>
}

/**
 * a.k.a. event reducer
 * a.k.a. snapshot maker
 * a.k.a. aggregate maintainer
 * */
export interface IModel<A, E extends JsonValue, ET extends ID = string, AT extends ID = string> {
  aggregate_type: AT
  eventTypes: ET[]

  init(): A

  reduce(events: Array<IEvent<E, ET>>, init: A): A
}
