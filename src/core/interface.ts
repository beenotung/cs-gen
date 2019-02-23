import { ICommand, IEvent, INewEvent, IQuery } from './data';
import { SaveEventResult } from './helper.types';
import { ID, JsonValue, pos_int } from './type';

/**
 * @field versionSince: inclusive boundary
 * @field timestampSince: inclusive boundary
 * */
export interface IEventSelector<E extends JsonValue, T extends ID = string> {
  aggregate_id: string
  types: 'all' | T[]
  versionSince?: pos_int
  timestampSince?: pos_int
}

export type IEventConsumer<Event extends IEvent<Event['data'], Event['type']>> =
  (events: Event[]) => void | Promise<void>;

export interface IEventStore<Event extends IEvent<Event['data'], Event['type']>> {
  saveEvents(events: Array<INewEvent<Event>>): Promise<SaveEventResult<Event>>

  getEventsFor(aggregate_id: string, cb: IEventConsumer<Event>): void

  getEventsBy(selector: IEventSelector<Event['data'], Event['type']>, cb: IEventConsumer<Event>)

  subscribeEventsFor(aggregate_id: string, cb: IEventConsumer<Event>): void

  subscribeEventsBy(selector: IEventSelector<Event['data'], Event['type']>, cb: (events: Event[]) => void): void
}

export interface IWriteModel<Command extends ICommand<Command['command'], Command['result'], Event, Command['type']>,
  Event extends IEvent<Event['data'], Event['type']>,
  > {
  command(command: Command): Promise<Command['result']>
}

export interface IReadModel<Event extends IEvent<Event['data'], Event['type']>,
  Query extends IQuery<Query['query'], Query['response'], Query['type']>,
  > {
  query(query: Query): Promise<Query['response']>

  querySince(query: Query, sinceTimestamp: pos_int): Promise<Query['response']>
}
