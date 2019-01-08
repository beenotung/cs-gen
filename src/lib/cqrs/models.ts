import { Changes as _Changes } from 'rethinkdb-ts';
import { Observable } from 'rxjs/internal/Observable';
import { command, command_handler, event, event_handler, id, query_handler, seq } from './types';

export interface domain<E, C, Q, R, ET, CT, QT, RT,
  qh extends query_handler<Q, R, QT, RT>> {
  name: string
  event_types: ET[]
  command_types: CT[]
  event_handler: event_handler<E, ET>
  command_handler: command_handler<C, E, CT, ET>
  query_handler: qh
}

export interface event_filter<T> {
  aggregate_id?: id
  type?: T
  since?: seq
}

export interface command_filter<T> {
  aggregate_id?: id
  type?: T
  since?: seq
}

export type Changes<T> = _Changes<T>;

export interface event_store<E, ET> {
  /* list of id so far */
  listAggregateIds(): Promise<id[]>

  getLastVersion(aggregate_id: id): Promise<seq>

  /* fail if the expected version doesn't match current version */
  storeEvents(events: Array<event<E, ET>>, expected_version: seq): Promise<void>

  /* retrieval list of events so far (batch) */
  listEvents(filter: event_filter<ET>): Promise<Array<event<E, ET>>>

  /* scan all events so far (iterative), more memory effective than listEvents() */
  scanEvents(filter: event_filter<ET>): Observable<event<E, ET>>

  /* will never stop, will get future events as well */
  subscribeEvents(filter: event_filter<ET>): Observable<Changes<event<E, ET>>>
}

export interface command_bus<C, CT> {
  sendCommand(command: command<C, CT>): Promise<void>

  subscribeCommand(filter: command_filter<CT>): Observable<Changes<command<C, CT>>>
}

export interface cqrs_engine<E, C, Q, R, ET, CT, QT, RT,
  qh extends query_handler<Q, R, QT, RT>> {
  eventStore: event_store<E, ET>
  commandBus: command_bus<C, CT>

  addDomain(domain: domain<E, C, Q, R, ET, CT, QT, RT, qh>)
}
