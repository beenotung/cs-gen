import { EventStore } from './store';
import { Command, Event, Query as _Query } from './types';
import { Mapper } from './utils';

export type CommandHandler<C, E> = Mapper<Command<C>, Array<Event<E>>>;
export type QueryHandler<Q, R, Query extends _Query<Q, R>> = Mapper<
  Query,
  R | Promise<R>
>;

export interface CqrsEngine<C, E, Q, R, Query extends _Query<Q, R>> {
  getEventStore(eventType: string): EventStore<E>;

  registerCommandHandler(commandType: string, f: CommandHandler<C, E>): void;

  registerQueryHandler(queryType: string, f: QueryHandler<Q, R, Query>): void;

  fireCommand(command: Command<C>): Promise<void>;

  query<iQ extends Q, iR extends R, iQuery extends Query & _Query<iQ, iR>>(
    query: iQuery,
  ): iR | Promise<iR>;
}
