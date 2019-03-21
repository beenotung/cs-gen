import { EventStore, EventStream } from '../event-store';
import { Model } from '../model';
import { EventStoreImpl } from './event-store-impl';
import { EventStreamImpl } from './event-stream-impl';
import { RouterModel } from './router-model';

export function createEventStore(): EventStore {
  return new EventStoreImpl();
}

export function createEventStream<T = any>(): EventStream<T> {
  return new EventStreamImpl();
}

export function createModel<State>(): Model<State> {
  return new RouterModel();
}
