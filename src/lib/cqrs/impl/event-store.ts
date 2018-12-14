import { HashedArray, mapGetOrSetDefault, new_counter } from '@beenotung/tslib';
import { EventStore } from '../store';
import { Event, id } from '../types';
import { Consumer, idToString, partialMatch } from '../utils';

const HEIGHT = '_height_';

export class RamEventStoreImpl implements EventStore {
  data = new HashedArray<Event<any>>(x => idToString(x.id));

  counter = new_counter();
  listeners = new Map<string, Array<Consumer<Event<any>>>>();
  anyListener: Array<Consumer<Event<any>>> = [];

  async find<T>(qs: Array<Partial<Event<T>>>): Promise<Array<Event<T>>> {
    return this.data.array.filter(t =>
      qs.some(q => partialMatch(q, t)),
    );
  }

  async get<T>(id: id): Promise<Event<T>> {
    return this.data.get(idToString(id));
  }

  async getByHeight<E>(since: number, count: number): Promise<Array<Event<E>>> {
    return this.data.array.slice(since, since + count);
  }

  async getHeight(): Promise<number> {
    return this.data.array.length;
  }

  async newId(): Promise<id> {
    return 'ram-' + this.counter.next();
  }

  async store<T>(event: Event<T>): Promise<void> {
    this.data.upsert(event);
    this.anyListener.forEach(f => f(event));
    (this.listeners.get(event.type) || []).forEach(f => f(event));
  }

  subscribe<E>(type: string, listener: Consumer<Event<E>>) {
    mapGetOrSetDefault(this.listeners, type, () => []).push(listener);
  }

  subscribeAll<E>(listener: Consumer<Event<E>>) {
    this.anyListener.push(listener);
  }
}
