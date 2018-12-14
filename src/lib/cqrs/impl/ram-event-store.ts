import { HashedArray } from '@beenotung/tslib/hashed-array';
import { throwError } from '../../../utils/error';
import { Consumer } from '../types/api.types';
import { ConcreteTypeSelector, Event, id } from '../types/data.types';
import { EventStore } from '../types/store.types';
import { idToString } from '../utils';

export class RamEventStoreImpl<T> implements EventStore<T> {
  events = new HashedArray<Event<T>>();
  listeners = new Map<string, Array<Consumer<Array<Event<T>>>>>();

  async get(id: id): Promise<Event<T>> {
    return (
      this.events.get(idToString(id)) || throwError(new Error('not found'))
    );
  }

  async getAfter(
    types: ConcreteTypeSelector,
    height: number,
  ): Promise<Array<Event<T>>> {
    return this.events.array.splice(height);
  }

  async getHeight(): Promise<number> {
    return this.events.array.length;
  }

  addListener(type: string, consumer: Consumer<Array<Event<T>>>) {
    let cs: Array<Consumer<Array<Event<T>>>>;
    if (this.listeners.has(type)) {
      cs = this.listeners.get(type);
    } else {
      cs = [];
      this.listeners.set(type, cs);
    }
    cs.push(consumer);
  }

  listen(types: ConcreteTypeSelector, consumer: Consumer<Array<Event<T>>>) {
    if (typeof types === 'string') {
      this.addListener(types, consumer);
    } else if (Array.isArray(types)) {
      types.forEach(type => this.addListener(type, consumer));
    } else {
      throw new Error('invalid types: ' + types);
    }
  }

  async storeAll(events: Array<Event<T>>): Promise<void> {
    events.forEach(event => this.events.insert(event));
  }

  async storeOne(event: Event<T>): Promise<void> {
    this.events.insert(event);
  }
}
