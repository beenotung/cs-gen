import { Obj } from '@beenotung/tslib/lang';
import { EventHandler, Model, ModelStatus } from '../types/api.types';
import {
  AggregateObject,
  ConcreteTypeSelector,
  Event,
} from '../types/data.types';
import { EventStore, StateStore } from '../types/store.types';
import { foreachType, map_push, mapTypes } from '../utils';
import { EventHeight, EventHeightType, toEventHeightId } from './common';

export abstract class GeneralModel<State, E>
  implements Model<State | EventHeight, E> {
  abstract eventTypes: ConcreteTypeSelector;
  abstract objectType: string;

  eventHandlers = new Map<string, Array<EventHandler<State, E>>>();

  private _write = Promise.resolve();

  abstract getEventStore(eventType: string): Promise<EventStore<E>>;

  abstract getStateStore(): Promise<StateStore<State | EventHeight>>;

  getStatus(): Promise<ModelStatus<State | EventHeight>> {
    return this.write(async () => {
      const [stateStore, version] = await Promise.all([
        this.getStateStore(),
        this.getVersion(),
      ]);
      const eventHeights: Obj<number> = {};
      const [state] = await Promise.all([
        stateStore.getAll(),
        mapTypes(this.eventTypes, type =>
          this.getLocalEventHeight(type).then(
            height => (eventHeights[type] = height),
          ),
        ),
      ]);
      return { state, version, eventHeights };
    });
  }

  async setLocalEventHeight(eventType: string, height: number): Promise<void> {
    const store = await this.getStateStore();
    const id = toEventHeightId(eventType);
    const oldState = await store.get(id);
    const newState: AggregateObject<EventHeight> = {
      id,
      version: oldState ? oldState.version : 1,
      type: EventHeightType,
      payload: height,
    };
    await store.store(newState);
  }

  getLocalEventHeight(eventType: string): Promise<number> {
    return this.getStateStore()
      .then(store => store.get(toEventHeightId(eventType)))
      .then(x => {
        if (x === undefined || x === null) {
          return 0;
        }
        if (x.payload === undefined || x.payload === null) {
          return 0;
        }
        if (typeof x.payload === 'number') {
          return x.payload;
        }
        throw new TypeError('expected number, got: ' + typeof x.payload);
      });
  }

  async isSynced(): Promise<boolean> {
    const [remoteHeights, localHeights] = await Promise.all([
      this.mapEventStores(e => e.getHeight()),
      Promise.all(
        mapTypes(this.eventTypes, type => this.getLocalEventHeight(type)),
      ),
    ]);
    if (remoteHeights.length !== localHeights.length) {
      throw new Error('inconsistent event store amount');
    }
    for (const i in remoteHeights) {
      if (remoteHeights[i] !== localHeights[i]) {
        return false;
      }
    }
    return true;
  }

  handleEvent(events: Event<E>): Promise<void> {
    return this.handleEvents([events]);
  }

  abstract async handleEvents(events: Array<Event<E>>): Promise<void>;

  registerEventHandler(eventHandler: EventHandler<State, E>): this {
    foreachType(eventHandler.eventTypes, type =>
      map_push(this.eventHandlers, type, eventHandler),
    );
    return this;
  }

  setStatus(status: ModelStatus<State>): Promise<void> {
    return this.write(async () => {
      await Promise.all([
        this.getStateStore().then(store => store.storeAll(status.state)),
        Promise.all(
          Object.keys(status).map(type =>
            this.setLocalEventHeight(type, status.eventHeights[type]),
          ),
        ),
      ]);
    });
  }

  startSync(): Promise<void> {
    return this.write(
      () =>
        new Promise((resolve, reject) => {
          const checkSynced = () =>
            this.isSynced().then(b => {
              if (b) {
                resolve();
              }
            });
          checkSynced();
          let write = Promise.resolve();
          this.mapEventStores(eventStore =>
            eventStore.listen(this.eventTypes, events => {
              write = write.then(() => this.handleEvents(events));
              write.then(checkSynced).catch(reject);
            }),
          ).catch(reject);
          write.catch(reject);
        }),
    );
  }

  async syncOnce(): Promise<void> {
    return this.write(
      () =>
        new Promise<void>((resolve, reject) => {
          const checkSynced = () =>
            this.isSynced().then(b => {
              if (b) {
                resolve();
              }
            });
          let write = Promise.resolve();
          this.mapEventStores(async (eventStore, eventType) => {
            const events = await eventStore.getAfter(
              this.eventTypes,
              await this.getLocalEventHeight(eventType),
            );
            write = write.then(() => this.handleEvents(events));
            write.then(checkSynced).catch(reject);
          }).catch(reject);
          write.catch(reject);
        }),
    );
  }

  mapEventStores<A>(
    f: (eventStore: EventStore<any>, eventType: string) => A | Promise<A>,
  ): Promise<A[]> {
    if (Array.isArray(this.eventTypes)) {
      return Promise.all(
        this.eventTypes.map(eventType =>
          this.getEventStore(eventType).then(eventStore =>
            f(eventStore, eventType),
          ),
        ),
      );
    } else {
      return this.getEventStore(this.eventTypes)
        .then(eventStore => f(eventStore, this.eventTypes as string))
        .then(x => [x]);
    }
  }

  async getVersion(): Promise<number> {
    return (await this.mapEventStores(e => e.getHeight())).reduce(
      (acc, c) => acc + c,
    );
  }

  write<A>(f: () => A | Promise<A>): Promise<A> {
    return new Promise<A>((resolve, reject) => {
      this._write = this._write.then(
        () =>
          new Promise<void>(resolveWrite => {
            try {
              Promise.resolve(f())
                .then(resolve)
                .catch(reject)
                .then(resolveWrite);
            } catch (e) {
              reject(e);
              resolveWrite();
            }
          }),
      );
    });
  }
}
