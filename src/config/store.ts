import { Consumer } from '@beenotung/tslib/functional/types';
import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { setStoreName, storeSet } from '@beenotung/tslib/store';
import { Store } from '../lib/cqrs/store';
import { typed_data } from '../lib/cqrs/types';
import { idToString } from '../lib/cqrs/utils';

export class AppStore implements Store<typed_data> {
  listeners: Map<string, Array<Consumer<typed_data>>> = new Map();

  constructor() {
    setStoreName('AppStore');
  }

  async store(t: typed_data): Promise<void> {
    storeSet(idToString(t.id), t);
    const fs = this.listeners.get(t.type);
    if (fs) {
      fs.forEach(f => f(t));
    }
  }

  subscribe(type: string, onEvent: (event: typed_data) => void) {
    mapGetOrSetDefault(this.listeners, type, () => []).push(onEvent);
  }
}
