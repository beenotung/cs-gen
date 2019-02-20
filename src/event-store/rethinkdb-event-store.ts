import { Connection } from 'rethinkdb-ts';
import { IEventStore } from '../core/cqrs.types';
import { IEvent } from '../core/data';
import { SaveEventResult } from '../core/helper.types';
import { pos_int } from '../core/type';

export class RethinkdbEventStore implements IEventStore {
  constructor(public conn: Connection) {
  }

  saveEvents<E, T>(events: Array<IEvent<E, T>>): Promise<SaveEventResult> {
    return undefined;
  }

  getEventsFor<E, T>(aggregate_id: string): Promise<Array<IEvent<E, T>>> {
    return undefined;
  }

  getEventsForSince<E, T>(aggregate_id: string, version: pos_int): Promise<Array<IEvent<E, T>>> {
    return undefined;
  }

  subscribeEventsFor<E, T>(aggregate_id: string, cb: (events: Array<IEvent<E, T>>) => void) {
  }

  subscribeEventsForSince<E, T>(aggregate_id: string, version: pos_int, cb: (events: Array<IEvent<E, T>>) => void) {
  }
}
