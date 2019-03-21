import { HashedArray } from '@beenotung/tslib/hashed-array';
import {
  Event,
  EventSelector,
  EventStore,
  EventStream,
  eventToId,
} from '../event-store';
import { createEventStream } from './impl';

export class EventConfliction extends Error {
  constructor(public eventId: string) {
    super('Event Conflicting: eventId = ' + eventId);
  }
}

export class EventStoreImpl implements EventStore {
  events = new HashedArray<Event>(e => eventToId(e));

  constructor() {}

  getAll(): EventStream<Event> {
    const stream = createEventStream();
    setTimeout(() => {
      this.events.array.forEach(e => stream.emit(e));
    });
    return stream;
  }

  getAllBy(selector: EventSelector): EventStream<Event> {
    const stream = createEventStream();
    setTimeout(() => {
      this.events.array.forEach(e => {
        if (
          (!selector.aggregate_id ||
            selector.aggregate_id === e.aggregate_id) &&
          (!selector.aggregate_type ||
            selector.aggregate_type === e.aggregate_type)
        ) {
          stream.emit(e);
        }
      });
    });
    return stream;
  }

  async store(event: Event) {
    const id = eventToId(event);
    if (this.events.has(id)) {
      throw new EventConfliction(id);
    }
    this.events.insert(event);
  }

  async storeAll(events: Event[]) {
    const ids = events.map(e => eventToId(e));
    ids.forEach((id, i) => {
      if (this.events.has(id) || ids.indexOf(id, i + 1) !== -1) {
        throw new EventConfliction(id);
      }
    });
    events.forEach(e => this.events.insert(e));
  }
}
