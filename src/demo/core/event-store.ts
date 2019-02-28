import { Dispatcher } from './dispatcher';
import { id, JsonValue } from './util-types';
import { IEvent, INewEvent } from './data-types';
import { Result } from './callback';
import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { ensureJsonValue } from '../utils/json';
import { getLocalStorage, Store } from '@beenotung/tslib/store';

let allAggregateEvents = new Map<string, IEvent[]>();
let store = Store.create(getLocalStorage('data', Number.MAX_SAFE_INTEGER));
let KEY_EVENTS = 'events';

let events: IEvent[] = store.getObject(KEY_EVENTS);
events.forEach(event => mapGetOrSetDefault(allAggregateEvents, event.aggregate_id, () => []).push(event));

/**
 * in-memory implementation
 * */
export class EventStore<T extends id = any> extends Dispatcher<T, IEvent & JsonValue> {

  saveEvents<Event extends IEvent<Event['event'], Event['type']>>(events: INewEvent<Event>[]): Result<Event[]> {
    let savedEvents = events.map(newEvent => {
      let aggregateEvents = mapGetOrSetDefault(allAggregateEvents, newEvent.aggregate_id, () => []);
      if (aggregateEvents.length > 0) {
        let last = aggregateEvents[aggregateEvents.length - 1];
        if (last.seq !== aggregateEvents.length) {
          console.error('concurrency conflict on saved event, count:', aggregateEvents.length, 'but last seq is:');
          throw new Error('seq conflict on saved event');
        }
      }
      let lastVersion = aggregateEvents.length;
      let event: Event = ensureJsonValue(newEvent as Event);
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
