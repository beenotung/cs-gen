import { mapGetOrSetDefault } from '@beenotung/tslib';
import { CqrsEngine } from '../api';
import { Command, Event, Query } from '../types';
import { Mapper } from '../utils';

export class CqrsEngineImpl implements CqrsEngine {
  commandHandlers = new Map<string, Array<Mapper<Command<any>, Array<Event<any>>>>>();
  queryHandlers = new Map<string, Mapper<Query<any, any>, any | Promise<any>>>();

  registerCommandHandler<C, E>(commandType: string, f: Mapper<Command<C>, Array<Event<E>>>) {
    mapGetOrSetDefault(this.commandHandlers, commandType, () => []).push(f);
  }

  registerQueryHandler<Q, R>(queryType: string, f: Mapper<Query<Q, R>, R | Promise<R>>) {
    if (this.queryHandlers.has(queryType)) {
      console.warn('overriding query handler for type: ' + queryType);
    }
    this.queryHandlers.set(queryType, f);
  }
}
