import { groupBy } from '@beenotung/tslib/functional';
import { Consumer } from '@beenotung/tslib/functional/types';
import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { getLocalStorage, Store } from '@beenotung/tslib/store';
import { IEventStore } from '../core/cqrs.types';
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

export class LocalstorageEventStore implements IEventStore {
  _store: Store;
  _eventIds: string[];

  _eventListeners = new Map<string, Array<Consumer<Array<IEvent<any, any>>>>>();

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
    eventsToSave.forEach(event => this.saveObject(eventKey(event), event));
    metas.forEach(meta => this.saveObject(eventMetaKey(meta.aggregate_id), meta));
    setTimeout(() => {
      groupBy(event => event.aggregate_id, eventsToSave)
        .forEach((events, aggregate_id) =>
          mapGetOrSetDefault(this._eventListeners, aggregate_id, () => []).forEach(cb => {
            try {
              cb(events);
            } catch (e) {
              console.error(e);
            }
          }));
    });
    return Promise.resolve('ok' as 'ok');
  }

  getEventsFor<E extends JsonValue, T extends ID>(aggregate_id: string): Promise<Array<IEvent<E, T>>> {
    const meta = this.getEventMeta(aggregate_id);
    const events: Array<IEvent<E, T>> = new Array(meta.last_version);
    for (let version = 1; version <= meta.last_version; version++) {
      events.push(this.getObject(eventKey({ aggregate_id, version })));
    }
    return Promise.resolve(events);
  }

  getEventsForSince<E extends JsonValue, T extends ID>(aggregate_id: string, sinceVersion: pos_int): Promise<Array<IEvent<E, T>>> {
    const meta = this.getEventMeta(aggregate_id);
    const events: Array<IEvent<E, T>> = new Array(meta.last_version);
    for (let version = sinceVersion; version <= meta.last_version; version++) {
      events.push(this.getObject(eventKey({ aggregate_id, version })));
    }
    return Promise.resolve(events);
  }


  subscribeEventsFor<E extends JsonValue, T extends ID>(aggregate_id: string, cb: (events: Array<IEvent<E, T>>) => void) {
    mapGetOrSetDefault(this._eventListeners, aggregate_id, () => [])
      .push(cb);
  }

  subscribeEventsForSince<E extends JsonValue, T extends ID>
  (aggregate_id: string, sinceVersion: pos_int, cb: (events: Array<IEvent<E, T>>) => void) {
    mapGetOrSetDefault(this._eventListeners, aggregate_id, () => [])
      .push(events => cb(events.filter(event => event.version >= sinceVersion)));
  }
}
