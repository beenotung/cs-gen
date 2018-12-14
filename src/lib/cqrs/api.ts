import { Command, Event, Query } from './types';
import { Mapper } from './utils';

export interface CqrsEngine {
  registerCommandHandler<C, E>(commandType: string, f: Mapper<Command<C>, Array<Event<E>>>)

  registerQueryHandler<Q, R>(queryType: string, f: Mapper<Query<Q, R>, Promise<R>>)
}
