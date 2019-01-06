import { CommandHandler, CqrsEngine, QueryHandler } from './cqrs-engine';
import { EventStore } from './store';
import { Event, id, Query as _Query } from './types';

export type Consumer<A> = (a: A) => void;
export type Mapper<A, B> = (a: A) => B;

export function idToString(id: id): string {
  return id.toString();
}

export function registerCommandByEnumList<C, E>(
  cqrsEngine: CqrsEngine<C, E, any, any, any>,
  handlers: Array<[string, CommandHandler<C, E>]>,
) {
  for (const [commandType, handler] of handlers) {
    cqrsEngine.registerCommandHandler(commandType, handler);
  }
}

export function subscribeEventByEnumList<E>(
  cqrsEngine: { getEventStore: Mapper<string, EventStore<E>> },
  handlers: Array<[string, Consumer<Event<E>>]>,
) {
  for (const [eventType, handler] of handlers) {
    cqrsEngine.getEventStore(eventType).subscribe(eventType, handler);
  }
}

export function registerQueryByEnumList<Q, R, Query extends _Query<Q, R>>(
  cqrsEngine: CqrsEngine<any, any, Q, R, Query>,
  handlers: Array<[string, QueryHandler<Q, R, Query>]>,
) {
  for (const [queryType, handler] of handlers) {
    cqrsEngine.registerQueryHandler(queryType, handler);
  }
}
