import { Consumer } from './api.types';
import { AggregateObject, ConcreteTypeSelector, Event, id } from './data.types';

export interface EventStore<T> {
  storeOne(event: Event<T>): Promise<void>;
  storeAll(events: Array<Event<T>>): Promise<void>;

  get(id: id): Promise<Event<T>>;

  getHeight(): Promise<number>;

  /**
   * inclusive
   * */
  getAfter(
    types: ConcreteTypeSelector,
    height: number,
  ): Promise<Array<Event<T>>>;

  listen(types: ConcreteTypeSelector, consumer: Consumer<Array<Event<T>>>);
}

export interface StateStore<T> {
  store(stateObject: AggregateObject<T>): Promise<void>;

  get(id: id): Promise<AggregateObject<T>>;

  find(
    types: ConcreteTypeSelector,
    filter: (s: AggregateObject<T>) => boolean,
  ): Promise<Array<AggregateObject<T>>>;
}
