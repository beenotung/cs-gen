import { EventStore } from './store';
import { Command, Event, Query } from './types';
import { Mapper } from './utils';

export interface CqrsEngine<C, E, Q, R> {
  getEventStore(eventType: string): EventStore<E>;

  registerCommandHandler(
    commandType: string,
    f: Mapper<Command<C>, Array<Event<E>>>,
  );

  registerQueryHandler(queryType: string, f: Mapper<Query<Q, R>, Promise<R>>);

  fireCommand(command: Command<C>): Promise<void>;

  query(query: Query<Q, R>): Promise<R>;
}
