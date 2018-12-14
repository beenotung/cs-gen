import { groupBy } from '@beenotung/tslib/functional';
import { mapToArray } from '@beenotung/tslib/map';
import { throwError } from '../../../utils/error';
import {
  CommandHandler,
  CqrsEngine,
  Model,
  QueryHandler,
} from '../types/api.types';
import {
  Command,
  Event,
  GeneralTypeSelector,
  Query,
} from '../types/data.types';
import { EventStore, StateStore } from '../types/store.types';
import { foreachType, map_getAll, map_push, mapTypes } from '../utils';

const mapEventType = (e: Event<any>) => e.type;

export class CqrsEngineImpl implements CqrsEngine {
  commandHandlers = new Map<string, Array<CommandHandler<any>>>();
  queryHandlers = new Map<string, Array<QueryHandler<any, any>>>();

  eventStores = new Map<string, EventStore<any>>();
  stateStores = new Map<string, StateStore<any>>();

  models = new Map<string, Model<any, any>>();

  async fireCommand<T>(cmd: Command<T>): Promise<void> {
    await Promise.all(
      map_getAll(this.commandHandlers, cmd.type).map(handler =>
        handler
          .handle(cmd)
          .then(events =>
            Promise.all(
              mapToArray(groupBy(mapEventType, events), (events, eventType) =>
                this.getEventStore(eventType).then(eventStore =>
                  eventStore.storeAll(events),
                ),
              ),
            ),
          ),
      ),
    );
  }

  setEventStore<T>(eventTypes: GeneralTypeSelector, eventStore: EventStore<T>) {
    foreachType(eventTypes, type => this.eventStores.set(type, eventStore));
  }

  async getEventStore<T>(eventType: string): Promise<EventStore<T>> {
    for (const type of [eventType, 'else', 'all']) {
      if (this.eventStores.has(type)) {
        return this.eventStores.get(type);
      }
    }
    throw new Error('not registered event store for type: ' + eventType);
  }

  getModel<State, E>(objectType: string): Model<State, E> {
    return (
      this.models.get(objectType) ||
      throwError(new Error('not registered model, type: ' + objectType))
    );
  }

  async getStateStore<T>(stateType: string): Promise<StateStore<T>> {
    for (const type of [stateType, 'else', 'all']) {
      if (this.stateStores.has(type)) {
        return this.stateStores.get(type);
      }
    }
    throw new Error('not registered state store for type: ' + stateType);
  }

  query<T, R>(query: Query<T, R>): Promise<R> {
    let res: Promise<R> = Promise.reject(
      new Error('not registered query handler of type: ' + query.type),
    );
    for (const type of [query.type, 'else']) {
      const handlers = map_getAll(this.queryHandlers, type);
      if (handlers.length === 0) {
        continue;
      }
      if (handlers.length > 1) {
        console.warn('multiple query handlers of type: ' + query.type);
      }
      handlers.forEach(
        handler => (res = res.catch(() => handler.handle(query))),
      );
      return handlers[0].handle(query);
    }
    return res;
  }

  registerCommandHandler<T, R>(commandHandler: CommandHandler<T>) {
    foreachType(commandHandler.commandTypes, type =>
      map_push(this.commandHandlers, type, commandHandler),
    );
    return this;
  }

  registerModel<State, E>(model: Model<State, E>) {
    this.models.set(model.objectType, model);
    return this;
  }

  registerQueryHandler<T, R>(queryHandler: QueryHandler<T, R>) {
    foreachType(queryHandler.queryTypes, type =>
      map_push(this.queryHandlers, type, queryHandler),
    );
    return this;
  }

  async startSync(model: Model<any, any>) {
    await model.startSync();
    await Promise.all(
      mapTypes(model.eventTypes, type =>
        this.getEventStore(type).then(store =>
          store.listen(model.eventTypes, events => {
            return model.handleEvents(events);
          }),
        ),
      ),
    );
  }

  syncOnce(model: Model<any, any>) {
    return model.syncOnce();
  }

  async startSyncAll(): Promise<void> {
    await Promise.all(mapToArray(this.models, model => this.startSync(model)));
  }
}
