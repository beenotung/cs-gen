import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { Handler, Mapper } from './callback';
import { IEvent, IQuery } from './data-types';
import { EventStore } from './event-store';

/**
 * @alias QueryHandler
 * @alias ReadModel
 * */
export class ReadModel<Event extends IEvent<Event['event'], Event['type']> = any,
  Query extends IQuery<Query['query'], Query['response'], Query['type']> = any> {
  queryHandlers = new Map<Query['type'], Mapper<Query, Query['response']>>();
  eventHandlers = new Map<Event['type'], Array<Handler<Event>>>();

  constructor(public eventStore: EventStore<Event['type']>) {
  }

  destroy() {
    this.eventHandlers.forEach((handlers, type) => handlers.forEach(handler => this.eventStore.unregister(type, handler)));
    this.eventHandlers.clear();
    this.queryHandlers.clear();
    delete this.eventHandlers;
    delete this.queryHandlers;
  }

  when<E extends Event = any>(type: Event['type'], handler: Handler<E>) {
    handler = handler.bind(this);
    mapGetOrSetDefault(this.eventHandlers, type, () => []).push(handler);
    this.eventStore.register(type, handler);
  }

  provide<Q extends Query = any>(type: Query['type'], handler: Mapper<Q, Q['response']>) {
    this.queryHandlers.set(type, handler);
  }

  query<Q extends Query = any>(query: Q): Q['response'] {
    return this.queryHandlers.get(query.type)(query);
  }
}
