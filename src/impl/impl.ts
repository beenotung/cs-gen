import { EventStore, EventStream } from '../event-store';
import { EventStoreImpl } from './event-store-impl';
import { EventStreamImpl } from './event-stream-impl';

export function createEventStore(): EventStore {
  return new EventStoreImpl();
}

export function createEventStream<T = any>(): EventStream<T> {
  return new EventStreamImpl();
}
