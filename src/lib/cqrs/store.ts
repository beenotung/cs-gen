import { DataObject, Event, id } from './types';
import { Consumer, Mapper } from './utils';

export interface Store {
  newId(): Promise<id>

  store<T>(data: DataObject<T>): Promise<void>

  get<T>(id: id): Promise<DataObject<T>>

  find<T>(qs: Array<Partial<DataObject<T>>>): Promise<Array<DataObject<T>>>

  match<T>(pred: Mapper<DataObject<T>, boolean>): Promise<Array<DataObject<T>>>
}

export interface EventStore {
  newId(): Promise<id>

  store<T>(event: Event<T>): Promise<void>

  get<T>(id: id): Promise<Event<T>>

  find<T>(qs: Array<Partial<Event<T>>>): Promise<Array<Event<T>>>

  getHeight(): Promise<number>

  getByHeight<E>(since: number, count: number): Promise<Array<Event<E>>>

  subscribe<E>(type: string, listener: Consumer<Event<E>>)

  subscribeAll<E>(listener: Consumer<Event<E>>)
}
