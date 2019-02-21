import { groupBy } from '@beenotung/tslib/functional';
import { Consumer } from '@beenotung/tslib/functional/types';
import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { getLocalStorage, Store } from '@beenotung/tslib/store';
import { IEventSelector, IEventStore } from '../core/cqrs.types';
import { IEvent, INewEvent } from '../core/data';
import { SaveEventResult } from '../core/helper.types';
import { ID, JsonValue, pos_int } from '../core/type';
import { IEventMeta } from './data';

const KEY_EVENT_LIST = '_event-list';
const KEY_EVENT_META = '_event-meta';

function eventMetaKey(aggregate_id: string): string {
  return [KEY_EVENT_META, aggregate_id].join('-');
}

function eventKey(event: { aggregate_id: string, version: pos_int }): string {
  return [event.aggregate_id, event.version].join('-');
}

function eventFilter<Event extends IEvent<any, any>>(events: Event[], selector: IEventSelector<any, any>): Event[] {
  return events.filter(event => {
    if (selector.aggregate_id && event.aggregate_id !== selector.aggregate_id) {
      return false;
    }
    if (selector.type && event.type !== selector.type) {
      return false;
    }
    if (selector.versionSince && event.version > selector.versionSince) {
      return false;
    }
    if (selector.timestampSince && event.timestamp > selector.timestampSince) {
      return false;
    }
    return true;
  });
}

export class LocalstorageEventStore implements IEventStore {
  _store: Store;
  _eventIds: string[];

  _aggregateEventListeners = new Map<string, Array<Consumer<Array<IEvent<any, any>>>>>();
  _allEventListeners: Array<Consumer<Array<IEvent<any, any>>>> = [];

  constructor(public dirpath: string) {
    // this._store = CachedObjectStore.create(dirpath);
    this._store = Store.create(getLocalStorage(dirpath));
    this._eventIds = this._store.getObject(KEY_EVENT_LIST) || [];
  }

  getEventIds(): string[] {
    return this._eventIds.map(x => x);
  }

  getObject<T>(key: string) {
    return this._store.getObject<T>(key);
  }

  saveObject<T>(key: string, data: T) {
    return this._store.setObject(key, data);
  }

  getEventMeta(aggregate_id: string): IEventMeta {
    return this.getObject(eventMetaKey(aggregate_id)) || {
      aggregate_id,
      last_version: 0,
    };
  }

  onEvents(events: Array<IEvent<any, any>>) {
    setTimeout(() => {
      groupBy(event => event.aggregate_id, events)
        .forEach((events, aggregate_id) =>
          mapGetOrSetDefault(this._aggregateEventListeners, aggregate_id, () => [])
            .forEach(cb => {
              try {
                cb(events);
              } catch (e) {
                console.error(e);
              }
            }),
        );
      this._allEventListeners.forEach(cb => {
        try {
          cb(events);
        } catch (e) {
          console.error(e);
        }
      });
    });
  }

  saveEvents<E extends JsonValue, T extends ID>(newEvents: Array<INewEvent<E, T>>): Promise<SaveEventResult> {
    const eventsToSave: Array<IEvent<E, T>> = [];
    const metas = new Map<string, IEventMeta>();
    for (const newEvent of newEvents) {
      const metaKey = eventMetaKey(newEvent.aggregate_id);
      const eventMeta = mapGetOrSetDefault(metas, metaKey, () => this.getEventMeta(newEvent.aggregate_id));
      if (typeof newEvent.version === 'number' && newEvent.version !== eventMeta.last_version + 1) {
        return Promise.resolve('version_conflict' as 'version_conflict');
      }
      eventMeta.last_version++;
      const event: IEvent<E, T> = Object.assign({
        version: eventMeta.last_version,
      }, newEvent);
      eventsToSave.push(event);
    }
    const newEventIds = this.getEventIds();
    eventsToSave.forEach(event => {
      const eventId = eventKey(event);
      newEventIds.push(eventId);
      this.saveObject(eventId, event);
    });
    metas.forEach(meta => this.saveObject(eventMetaKey(meta.aggregate_id), meta));
    this.saveObject(KEY_EVENT_LIST, newEventIds);
    this._eventIds = newEventIds;
    this.onEvents(eventsToSave);
    return Promise.resolve('ok' as 'ok');
  }

  getEventsFor<Event extends IEvent<E, T>, E extends JsonValue, T extends ID>(aggregate_id: string): Promise<Event[]> {
    const meta = this.getEventMeta(aggregate_id);
    const events: Event[] = new Array(meta.last_version);
    for (let version = 1; version <= meta.last_version; version++) {
      events.push(this.getObject(eventKey({ aggregate_id, version })));
    }
    return Promise.resolve(events);
  }

  getEventsBy<Event extends IEvent<E, T>, E extends JsonValue, T extends ID>(selector: IEventSelector<E, T>): Promise<Event[]> {
    if (selector.aggregate_id && Object.keys(selector).length === 1) {
      return this.getEventsFor(selector.aggregate_id);
    }
    const matchedEvents: Event[] = [];
    this.getEventIds().forEach(eventId => {
      const event: Event = this.getObject(eventId);
      matchedEvents.push(...eventFilter([event], selector));
    });
    return Promise.resolve(matchedEvents);
  }

  subscribeEventsFor<E extends JsonValue, T extends ID>(aggregate_id: string, cb: (events: Array<IEvent<E, T>>) => void) {
    mapGetOrSetDefault(this._aggregateEventListeners, aggregate_id, () => [])
      .push(cb);
  }

  subscribeEventsBy<Event extends IEvent<E, T>, E extends JsonValue, T extends ID>
  (selector: IEventSelector<E, T>, cb: (events: Event[]) => void) {
    if (selector.aggregate_id && Object.keys(selector).length === 1) {
      return this.subscribeEventsFor(selector.aggregate_id, cb);
    }
    this._allEventListeners.push(events => cb(eventFilter<any>(events, selector)));
  }
}
