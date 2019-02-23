import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { getLocalStorage, Store } from '@beenotung/tslib/store';
import { IEvent, INewEvent } from '../core/data';
import { SaveEventResult } from '../core/helper.types';
import { IEventConsumer, IEventSelector, IEventStore } from '../core/interface';
import { pos_int } from '../core/type';
import { IEventMeta } from './data';

const KEY_EVENT_LIST = '_aggregate-id-list';
const KEY_EVENT_META = '_event-meta';

function eventMetaKey(aggregate_id: string): string {
  return [KEY_EVENT_META, aggregate_id].join('-');
}

function eventKey(event: { aggregate_id: string, version: pos_int }): string {
  return [event.aggregate_id, event.version].join('-');
}

function eventFilter<Event extends IEvent<any, any>>(events: Event[], selector: IEventSelector<Event['data'], Event['type']>): Event[] {
  return events.filter(event => {
    if (selector.aggregate_id !== event.aggregate_id) {
      return false;
    }
    if (selector.types !== 'all' && selector.types.indexOf(event.type) === -1) {
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

export class LocalstorageEventStore<Event extends IEvent<Event['data'], Event['type']>> implements IEventStore<Event> {
  _store: Store;
  _aggregateIds: string[];
  _eventMetas = new Map<string, IEventMeta>();

  constructor(dirpath: string) {
    this._store = Store.create(getLocalStorage(dirpath));
    this._aggregateIds = this._store.getObject(KEY_EVENT_LIST) || [];
  }

  onEvent = (events: Event[]) => {
    /* init place folder */
  }

  getAggregateIds(raw = false): string[] {
    if (raw) {
      return this._aggregateIds;
    }
    return this._aggregateIds.map(x => x);
  }

  saveAggregateIds(aggregateIds: string[]): void {
    this._aggregateIds = aggregateIds.map(x => x);
    this._store.setObject(KEY_EVENT_LIST, this._aggregateIds);
  }

  getEventMeta(aggregate_id: string): IEventMeta {
    return mapGetOrSetDefault(this._eventMetas, eventMetaKey(aggregate_id), () => this._store.getObject(aggregate_id) || {
      aggregate_id,
      last_version: 0,
    });
  }

  saveEventMeta(eventMeta: IEventMeta): void {
    this._eventMetas.set(eventMeta.aggregate_id, eventMeta);
    this._store.setObject(eventMetaKey(eventMeta.aggregate_id), eventMeta);
  }

  async saveEvents(events: Array<INewEvent<Event['data'], Event['type']>>): Promise<SaveEventResult<Event>> {
    const eventsToSave = new Array<IEvent<Event['data'], Event['type']>>(events.length);
    const eventMetas = new Map<string, IEventMeta>();
    const aggregateIds = new Set(this.getAggregateIds(true));
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventMeta = mapGetOrSetDefault(eventMetas, event.aggregate_id, () => this.getEventMeta(event.aggregate_id));
      if (event.version && event.version !== eventMeta.last_version + 1) {
        return 'version_conflict';
      }
      aggregateIds.add(event.aggregate_id);
      eventsToSave[i] = {
        aggregate_id: event.aggregate_id,
        type: event.type,
        version: eventMeta.last_version + 1,
        timestamp: event.timestamp,
        data: event.data,
      };
      eventMeta.last_version++;
    }
    eventsToSave.forEach(event => this._store.setObject(eventKey(event), event));
    eventMetas.forEach(eventMeta => this.saveEventMeta(eventMeta));
    this.saveAggregateIds(Array.from(aggregateIds));
    return { ok: eventsToSave as Event[] };
  }

  getEventsFor(aggregate_id: string, cb: IEventConsumer<Event>): void {
    const n = this.getEventMeta(aggregate_id).last_version;
    for (let version = 1; version <= n; version++) {
      cb([this._store.getObject(eventKey({ aggregate_id, version }))]);
    }
    cb([]);
  }

  getEventsBy(selector: IEventSelector<Event['data'], Event['type']>, cb: IEventConsumer<Event>) {
    this.getEventsFor(selector.aggregate_id, events => {
      if (events.length === 0) {
        cb([]);
        return;
      }
      events = eventFilter(events, selector);
      if (events.length > 0) {
        return cb(events);
      }
    });
  }

  subscribeEventsFor(aggregate_id: string, cb: IEventConsumer<Event>): void {
    const f = this.onEvent;
    this.onEvent = events => {
      f(events);
      cb(events.filter(event => event.aggregate_id === aggregate_id));
    };
  }

  subscribeEventsBy(selector: IEventSelector<Event['data'], Event['type']>, cb: (events: Event[]) => void): void {
    const f = this.onEvent;
    this.onEvent = events => {
      f(events);
      cb(eventFilter(events, selector));
    };
  }
}
