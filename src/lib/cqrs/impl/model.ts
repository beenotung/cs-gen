import { Lock } from '@beenotung/tslib/lock';
import { EventHandler, Model, ModelStatus } from '../types/api.types';
import { AggregateObject, ConcreteTypeSelector, Event, GeneralTypeSelector } from '../types/data.types';
import { EventStore, StateStore } from '../types/store.types';
import { RamEventStoreImpl } from './ram-event-store';
import { RamStateStore } from './ram-state-store';

function toMap<K, V>(k: K, v: V): Map<K, V> {
  const res = new Map();
  res.set(k, v);
  return res;
}

export abstract class SingleModelImpl<State, E> implements Model<State, E> {
  abstract eventTypes: GeneralTypeSelector;
  objectTypes: string[];

  version = 0;
  writeLock = new Lock();
  localEventHeight = 0;
  eventHandlers: Array<EventHandler<State, E>> = [];

  constructor(
    public objectType = 'model',
    public eventStores: Map<GeneralTypeSelector, EventStore<E>> = toMap('all' as GeneralTypeSelector, new RamEventStoreImpl()),
    public stateStore: StateStore<State> = new RamStateStore()) {
    this.objectTypes = [this.objectType];
  }

  async getEventStore<T extends E>(eventType: GeneralTypeSelector): Promise<EventStore<T>> {
    return this.eventStores.get(eventType) as EventStore<T>;
  }

  async getStateStore<T extends State>(stateType: GeneralTypeSelector): Promise<StateStore<T>> {
    return this.stateStore as StateStore<T>;
  }

  async getStatus(): Promise<ModelStatus<State>> {
    if (this.version === 0) {
      return {
        version: 0,
        state: {} as State,
      };
    }
    const aggregateObject = await this.stateStore.get(this.version);
    return {
      state: aggregateObject.payload,
      version: this.version,
    };
  }

  async isSynced(): Promise<boolean> {
    const remoteEventHeight = (await this.mapEventStores(e => e.getHeight()))
      .reduce((acc, c) => acc + c);
    return this.localEventHeight === remoteEventHeight;
  }

  abstract reduceAll(events: Array<Event<E>>): Promise<State>;

  reduceOne(event: Event<E>): Promise<State> {
    return this.reduceAll([event]);
  }

  registerEventHandler(eventHandler: EventHandler<State, E>): this {
    this.eventHandlers.push(eventHandler);
    return this;
  }

  async setStatus(status: ModelStatus<State>): Promise<void> {
    await this.writeLock.acquire();
    try {
      if (status.version !== this.version + 1) {
        throw new Error(`Version conflict, expect ${this.version + 1}, got ${status.version}`);
      }
      const aggregateObject: AggregateObject<State> = {
        id: status.version,
        type: 'model',
        payload: status.state,
      };
      await this.stateStore.store(aggregateObject);
      this.version = status.version;
    } catch (e) {
      throw e;
    } finally {
      this.writeLock.release();
    }
  }

  async startSync(): Promise<void> {
    await this.mapEventStores((eventStore, eventType) => eventStore.listen(eventType === 'else' ? 'all' : eventType, async events => {
      await this.writeLock.acquire();
      try {
        const newState = await this.reduceAll(events);
        const newVersion = this.version + 1;
        await this.setStatus({ version: newVersion, state: newState });
      } catch (e) {
        throw  e;
      } finally {
        this.writeLock.release();
      }
    }));
  }

  getEventStores(): Promise<Array<EventStore<E>>> {
    return this.mapEventStores(e => e);
  }

  mapEventStores<A>(f: (eventStore: EventStore<E>, eventType: GeneralTypeSelector) => A | Promise<A>): Promise<A[]> {
    if (Array.isArray(this.eventTypes)) {
      return Promise.all(
        this.eventTypes
          .map(et =>
            this.getEventStore(et as ConcreteTypeSelector)
              .then(e => f(e, et as ConcreteTypeSelector))));
    } else {
      return this.getEventStore(this.eventTypes).then(e => f(e, this.eventTypes)).then(x => [x]);
    }
  }
}
