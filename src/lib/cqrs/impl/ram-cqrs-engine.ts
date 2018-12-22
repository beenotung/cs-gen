import { CqrsEngine } from '../api';
import { EventStore } from '../store';
import { Command, Event, Query } from '../types';
import { Mapper } from '../utils';

export class CqrsEngineImpl<C, E, Q, R> implements CqrsEngine<C, E, Q, R> {
  commandHandlers = new Map<string, Mapper<Command<C>, Array<Event<E>>>>();
  queryHandlers = new Map<string, Mapper<Query<Q, R>, R | Promise<R>>>();

  constructor(
    private _eventStores:
      | { [eventType: string]: EventStore<E> }
      | Mapper<string, EventStore<E>>,
  ) {}

  getEventStore(eventType: string): EventStore<E> {
    const notFoundError = new Error('no eventStore for type: ' + eventType);
    let eventStore: EventStore<E>;
    if (typeof this._eventStores === 'function') {
      try {
        eventStore = this._eventStores(eventType);
      } catch (e) {
        throw notFoundError;
      }
    } else {
      eventStore = this._eventStores[eventType];
    }
    if (!eventStore) {
      throw notFoundError;
    }
    return eventStore;
  }

  registerCommandHandler(
    commandType: string,
    f: Mapper<Command<C>, Array<Event<E>>>,
    force = false,
  ) {
    if (!force && this.commandHandlers.has(commandType)) {
      throw new Error('duplicated command handler of type: ' + commandType);
    }
    this.commandHandlers.set(commandType, f);
  }

  registerQueryHandler(
    queryType: string,
    f: Mapper<Query<Q, R>, R | Promise<R>>,
    force = false,
  ) {
    if (!force && this.queryHandlers.has(queryType)) {
      throw new Error('duplicated query handler of type: ' + queryType);
    }
    this.queryHandlers.set(queryType, f);
  }

  async fireCommand(command: Command<C>): Promise<void> {
    if (!this.commandHandlers.has(command.type)) {
      throw new Error('no command handler for type: ' + command.type);
    }
    const events = this.commandHandlers.get(command.type)(command);
    await Promise.all(
      events.map(event => this.getEventStore(event.type).store(event)),
    );
  }

  async query(query: Query<Q, R>): Promise<R> {
    if (!this.queryHandlers.has(query.type)) {
      throw new Error('no query handler for type: ' + query.type);
    }
    return this.queryHandlers.get(query.type)(query);
  }
}
