import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { getLocalStorage, Store } from '@beenotung/tslib/store';
import { ensureJsonValue } from '../utils/json';
import { Result } from './callback';
import { IEvent, INewEvent } from './data-types';
import { Dispatcher } from './dispatcher';
import { id, JsonValue } from './util-types';

const allAggregateEvents = new Map<string, IEvent[]>();
const store = Store.create(getLocalStorage('data', Number.MAX_SAFE_INTEGER));
const KEY_EVENTS = 'events';

const events: IEvent[] = store.getObject(KEY_EVENTS) || [];
events.forEach(event => mapGetOrSetDefault(allAggregateEvents, event.aggregate_id, () => []).push(event));

/**
 * in-memory implementation
 * */
export class EventStore<T extends id = any> extends Dispatcher<T, IEvent & JsonValue> {

  saveEvents<Event extends IEvent<Event['event'], Event['type']>>(events: Array<INewEvent<Event>>): Result<Event[]> {
    const savedEvents = events.map(newEvent => {
      const aggregateEvents = mapGetOrSetDefault(allAggregateEvents, newEvent.aggregate_id, () => []);
      if (aggregateEvents.length > 0) {
        const last = aggregateEvents[aggregateEvents.length - 1];
        if (last.seq !== aggregateEvents.length) {
          console.error('concurrency conflict on saved event, count:', aggregateEvents.length, 'but last seq is:');
          throw new Error('seq conflict on saved event');
        }
      }
      const lastVersion = aggregateEvents.length;
      const event: Event = ensureJsonValue(newEvent as Event);
      if ('seq' in newEvent) {
        if (lastVersion + 1 !== newEvent.seq) {
          console.error('concurrency conflict on new event, expected new seq:', newEvent.seq, 'but last seq is:', lastVersion);
          throw new Error('seq conflict on new event');
        }
      } else {
        event.seq = lastVersion + 1;
      }
      aggregateEvents.push(event);
      return event;
    });
    events.push(...savedEvents);
    store.setObject(KEY_EVENTS, events);
    savedEvents.map(event => this.dispatch(event.type, event as any));
    return savedEvents;
  }

}
