import { Connection } from 'rethinkdb-ts';
import { IEventStore } from '../core/cqrs.types';
import { IEvent } from '../core/data';
import { SaveEventResult } from '../core/helper.types';
import { pos_int } from '../core/type';

export class RethinkdbEventStore implements IEventStore {
  constructor(public conn: Connection) {
  }

  saveEvents<E>(events: Array<IEvent<E>>): Promise<SaveEventResult> {
    return undefined;
  }

  getEventsFor<E>(aggregate_id: string): Promise<Array<IEvent<E>>> {
    return undefined;
  }

  getEventsForSince<E>(aggregate_id: string, version: pos_int): Promise<Array<IEvent<E>>> {
    return undefined;
  }

  subscribeEventsFor<E>(aggregate_id: string, cb: (events: Array<IEvent<E>>) => void) {
  }

  subscribeEventsForSince<E>(aggregate_id: string, version: pos_int, cb: (events: Array<IEvent<E>>) => void) {
  }
}
