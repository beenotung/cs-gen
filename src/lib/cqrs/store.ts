import { DataObject, Event, id } from './types';
import { Consumer, Mapper } from './utils';

export interface Store<T> {
  newId(): Promise<id>;

  store(data: DataObject<T>): Promise<void>;

  get(id: id): Promise<DataObject<T>>;

  find(...qs: Array<Partial<DataObject<T>>>): Promise<Array<DataObject<T>>>;

  match(pred: Mapper<DataObject<T>, boolean>): Promise<Array<DataObject<T>>>;
}

export interface EventStore<E> {
  newId(): Promise<id>;

  store(event: Event<E>): Promise<void>;

  get(id: id): Promise<Event<E>>;

  find(...qs: Array<Partial<Event<E>>>): Promise<Array<Event<E>>>;

  match(pred: Mapper<DataObject<E>, boolean>): Promise<Array<DataObject<E>>>;

  getHeight(): Promise<number>;

  getByHeight(since: number, count: number): Promise<Array<Event<E>>>;

  subscribe(type: string, listener: Consumer<Event<E>>);

  subscribeAll(listener: Consumer<Event<E>>);
}
