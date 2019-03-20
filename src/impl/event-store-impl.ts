import { Event, EventSelector, EventStore, EventStream } from '../event-store';
import { createEventStream } from './event-stream-impl';

export class EventStoreImpl implements EventStore {
  events: Event[] = [];

  constructor() {}

  getAll(): EventStream<Event> {
    const stream = createEventStream();
    setTimeout(() => {
      this.events.forEach(e => stream.emit(e));
    });
    return stream;
  }

  getAllBy(selector: EventSelector): EventStream<Event> {
    const stream = createEventStream();
    setTimeout(() => {
      this.events.forEach(e => {
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

  store(event: Event) {}
}
