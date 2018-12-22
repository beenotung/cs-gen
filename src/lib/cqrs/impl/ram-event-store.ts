import { HashedArray } from '@beenotung/tslib/hashed-array';
import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { search } from '@beenotung/tslib/search';
import { new_counter } from '@beenotung/tslib/uuid';
import { EventStore } from '../store';
import { DataObject, Event, id } from '../types';
import { Consumer, idToString, Mapper } from '../utils';

export class RamEventStoreImpl<E> implements EventStore<E> {
  data = new HashedArray<Event<any>>(x => idToString(x.id));

  counter = new_counter();
  listeners = new Map<string, Array<Consumer<Event<any>>>>();
  anyListener: Array<Consumer<Event<any>>> = [];

  async find(...qs: Array<Partial<Event<E>>>): Promise<Array<Event<E>>> {
    return this.data.array.filter(t => qs.some(q => search.partialMatch(q, t)));
  }

  async match(
    pred: Mapper<DataObject<E>, boolean>,
  ): Promise<Array<DataObject<E>>> {
    return this.data.array.filter(t => pred(t));
  }

  async get(id: id): Promise<Event<E>> {
    return this.data.get(idToString(id));
  }

  async getByHeight(since: number, count: number): Promise<Array<Event<E>>> {
    return this.data.array.slice(since, since + count);
  }

  async getHeight(): Promise<number> {
    return this.data.array.length;
  }

  async newId(): Promise<id> {
    return 'ram-' + this.counter.next();
  }

  async store(event: Event<E>): Promise<void> {
    this.data.upsert(event);
    this.anyListener.forEach(f => f(event));
    (this.listeners.get(event.type) || []).forEach(f => f(event));
  }

  subscribe(type: string, listener: Consumer<Event<E>>) {
    mapGetOrSetDefault(this.listeners, type, () => []).push(listener);
  }

  subscribeAll(listener: Consumer<Event<E>>) {
    this.anyListener.push(listener);
  }
}
