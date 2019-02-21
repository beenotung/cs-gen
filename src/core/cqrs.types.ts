import { ICommand, ICommandWithEvents, IEvent, INewEvent, IQuery } from './data';
import { SaveEventResult } from './helper.types';
import { ID, JsonValue, pos_int } from './type';

/**
 * @field versionSince: inclusive boundary
 * @field timestampSince: inclusive boundary
 * */
export interface IEventSelector<E extends JsonValue, T extends ID = string> {
  aggregate_id?: string
  type?: T
  versionSince?: pos_int
  timestampSince?: pos_int
}

export interface IEventStore {
  saveEvents<E extends JsonValue, T extends ID>(newEvents: Array<INewEvent<E, T>>): Promise<SaveEventResult>

  getEventsFor<Event extends IEvent<E, T>, E extends JsonValue, T extends ID>(aggregate_id: string): Promise<Event[]>

  getEventsBy<Event extends IEvent<E, T>, E extends JsonValue, T extends ID>(selector: IEventSelector<E, T>): Promise<Event[]>

  subscribeEventsFor<E extends JsonValue, T extends ID>(aggregate_id: string, cb: (events: Array<IEvent<E, T>>) => void)

  subscribeEventsBy<Event extends IEvent<E, T>, E extends JsonValue, T extends ID>
  (selector: IEventSelector<E, T>, cb: (events: Event[]) => void)
}

export interface ICqrsClient {
  sendCommand<Command extends ICommand<C, R, CT>, C extends JsonValue, R extends JsonValue, CT extends ID>
  (command: Command): Promise<Command>

  sendCommandAndGetEvents<Command extends ICommandWithEvents<C, R, E, CT, ET>,
    C extends JsonValue, R extends JsonValue, E extends JsonValue, CT extends ID, ET extends ID>
  (command: Command): Promise<Command>

  query<Query extends IQuery<Q, R, QT>, Q extends JsonValue, R extends JsonValue, QT extends ID>
  (query: Query): Promise<Query>

  /**
   * @param query
   * @param sinceTimestamp: minimum timestamp required to answer this query
   * */
  querySince<Query extends IQuery<Q, R, QT>, Q extends JsonValue, R extends JsonValue, QT extends ID>
  (query: Query, sinceTimestamp: pos_int): Promise<Query>
}

export interface ICqrsWriteServer<Command extends ICommand<C, R, CT>,
  CommandWithEvents extends ICommandWithEvents<C, R, E, CT, ET>,
  C extends JsonValue, R extends JsonValue, E extends JsonValue,
  CT extends ID = string, ET extends ID = string> {
  eventStore: IEventStore;

  handleCommand(command: Command): Promise<Command>

  handleCommandAndGetEvents(command: Command): Promise<Command>
}

export interface ICqrsReadServer<Query extends IQuery<Q, R, QT>,
  Q extends JsonValue, R extends JsonValue, QT extends ID = string> {
  eventStore: IEventStore;

  handleQuery(query: Query): Promise<Query>

  /**
   * @param query
   * @param sinceTimestamp: minimum timestamp required to answer this query
   * */
  handleQuerySince(query: Query, sinceTimestamp: pos_int): Promise<Query>
}

export interface IWriteModel<Command extends ICommand<C, R, CT>,
  CommandWithEvents extends ICommandWithEvents<C, R, E, CT, ET>,
  C extends JsonValue, R extends JsonValue, E extends JsonValue,
  CT extends ID = string, ET extends ID = string,
  > extends ICqrsWriteServer<Command, CommandWithEvents, C, R, E, CT, ET> {
  commandTypes: CT[]
}

/**
 * a.k.a. event reducer
 * a.k.a. snapshot maker
 * a.k.a. aggregate maintainer
 * */
export interface IReadModel<A, Event extends IEvent<E, ET>, Query extends IQuery<Q, R, QT>,
  E extends JsonValue, ET extends ID,
  Q extends JsonValue, R extends JsonValue, QT extends ID,
  AT extends ID = string> {
  aggregate_type: AT
  queryTypes: QT[]

  eventStore: IEventStore

  state: A
  timestamp: pos_int

  handleEvents(events: Event[]): Promise<void>

  handleQuery(query: Query): Promise<Query>

  /**
   * @param query
   * @param sinceTimestamp: minimum timestamp required to answer this query
   * */
  handleQuerySince(query: Query, sinceTimestamp: pos_int): Promise<Query>
}
