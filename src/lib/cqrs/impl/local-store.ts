import { remove } from '@beenotung/tslib/array';
import { Consumer } from '@beenotung/tslib/functional/types';
import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { getStore, setStoreName } from '@beenotung/tslib/store';
import { Store, Subscription } from '../store';
import { typed_data } from '../types';
import { idToString } from '../utils';

/**
 * type cannot contains hyphen ('-')
 * */
export function dataId(t: typed_data): string {
  return t.type + '-' + idToString(t.id);
}

export class LocalStore implements Store<typed_data> {
  ready: Promise<void>;
  _store: Storage;
  events: typed_data[];
  listener: Map<string, Array<Consumer<typed_data>>>;

  constructor() {
    setStoreName('data');
    this._store = getStore();
    this.events = [];
    this.listener = new Map();
    this.ready = new Promise<void>((resolve, reject) => {
      this.scanAll(x => this.events.push(x), reject, resolve);
    });
  }

  scanAll(scan: Consumer<typed_data>, onError: (err) => void, onComplete: () => void) {
    const n = this._store.length;
    for (let i = 0; i < n; i++) {
      const key = this._store.key(i);
      const text = this._store.getItem(key);
      try {
        const value = JSON.parse(text);
        scan(value);
      } catch (e) {
        onError(e);
      }
    }
    onComplete();
  }

  async getByType(type: string): Promise<any[]> {
    return this.events.filter(x => x.type === type);
  }

  async store(t: typed_data): Promise<void> {
    this._store.setItem(dataId(t), JSON.stringify(t));
    this.events.push(t);
    const fs = this.listener.get(t.type);
    if (fs) {
      fs.forEach(f => f(t));
    }
  }

  async subscribe(types: string[], onEvent: (err?, event?: typed_data) => void): Promise<Subscription> {
    this.events.forEach(t => {
      if (types.indexOf(t.type) !== -1) {
        onEvent(null, t);
      }
    });
    types.forEach(type => mapGetOrSetDefault(this.listener, type, () => []).push(onEvent));
    return {
      close: async () => types.forEach(type => remove(this.listener.get(type) || [], onEvent)),
    };
  }

  async subscribeSince(types: string[], offset: number, onEvent: (err?, event?: typed_data) => void): Promise<Subscription> {
    for (let i = offset; i < this.events.length; i++) {
      const t = this.events[i];
      if (types.indexOf(t.type) !== -1) {
        onEvent(null, t);
      }
    }
    types.forEach(type => mapGetOrSetDefault(this.listener, type, () => []).push(onEvent));
    return {
      close: async () => types.forEach(type => remove(this.listener.get(type) || [], onEvent)),
    };
  }

  get(idx: number): Promise<typed_data> {
    if (this.events[idx]) {
      return Promise.resolve(this.events[idx]);
    } else {
      return Promise.reject('no data for idx: ' + idx);
    }
  }

}
