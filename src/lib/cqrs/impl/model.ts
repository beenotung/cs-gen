import { EventHandler, Model, ModelStatus } from '../types/api.types';
import { ConcreteTypeSelector, Event } from '../types/data.types';
import { EventStore, StateStore } from '../types/store.types';
import { foreachType, map_push, mapTypes } from '../utils';

export abstract class GeneralModel<State, E> implements Model<State, E> {
  abstract eventTypes: ConcreteTypeSelector;
  abstract objectType: string;

  eventHandlers = new Map<string, Array<EventHandler<State, E>>>();

  abstract getEventStore(eventType: string): Promise<EventStore<E>>;

  abstract getStateStore(stateType: string): Promise<StateStore<State>>;

  abstract getStatus(): Promise<ModelStatus<State>>;

  abstract getLocalEventHeight(eventType: string): Promise<number>;

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

  abstract setStatus(status: ModelStatus<State>): Promise<void>;

  async startSync(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const checkSynced = (): Promise<void> =>
        this.isSynced()
          .then(b => (b ? resolve() : void 0))
          .catch(reject);
      let write = Promise.resolve();
      this.mapEventStores((eventStore, eventType) =>
        eventStore.listen(this.eventTypes, events => {
          write = write.then(() => this.handleEvents(events));
          write.then(checkSynced).catch(reject);
        }),
      ).catch(reject);
    });
  }

  async syncOnce(): Promise<void> {
    let write = Promise.resolve();
    await this.mapEventStores(async (eventStore, eventType) =>
      eventStore
        .getAfter(this.eventTypes, await this.getLocalEventHeight(eventType))
        .then(events => {
          write = write.then(() => this.handleEvents(events));
        }),
    );
    await write;
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
}
