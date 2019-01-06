import { Consumer } from '@beenotung/tslib/functional/types';
import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { setStoreName, storeGet, storeKeys, storeSet } from '@beenotung/tslib/store';
import { Store } from '../lib/cqrs/store';
import { typed_data } from '../lib/cqrs/types';
import { idToString } from '../lib/cqrs/utils';

/**
 * type cannot contains hyphen ('-')
 * */
export class AppStore implements Store<typed_data> {
  listeners: Map<string, Array<Consumer<typed_data>>> = new Map();
  events: typed_data[];

  constructor() {
    setStoreName('data');
    this.events = storeKeys().map(storeGet);
  }

  async store(t: typed_data): Promise<void> {
    storeSet(t.type + '-' + idToString(t.id), t);
    const fs = this.listeners.get(t.type);
    if (fs) {
      fs.forEach(f => f(t));
    }
  }

  async getByType(type: string): Promise<any[]> {
    return storeKeys()
      .filter(s => s.split('-')[0] === type)
      .map(k => storeGet(k) as typed_data)
      // .filter(x => x)
      // .filter(x => x.type === type)
      .map(x => x.data)
      ;
  }

  subscribe(type: string, onEvent: (event: typed_data) => void) {
    mapGetOrSetDefault(this.listeners, type, () => []).push(onEvent);
  }

}
