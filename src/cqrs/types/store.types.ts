import { Consumer } from './api.types';
import { AggregateObject, ConcreteTypeSelector, Event, id } from './data.types';

export interface EventStore<T> {
  store(event: Event<T>): Promise<void>

  get(id: id): Promise<Event<T>>

  getHeight(): Promise<number>

  /**
   * inclusive
   * */
  getAfter(types: ConcreteTypeSelector, height: number): Promise<Array<Event<T>>>

  listen(types: ConcreteTypeSelector, consumer: Consumer<Event<T>>)
}

export interface StateStore<T> {
  store(stateObject: AggregateObject<T>): Promise<void>

  get(id: id): Promise<AggregateObject<T>>

  find(types: ConcreteTypeSelector, filter: (s: AggregateObject<T>) => boolean): Promise<Array<AggregateObject<T>>>
}
