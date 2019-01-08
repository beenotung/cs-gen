import { Consumer } from '@beenotung/tslib/functional/types';

export interface Subscription {
  close: () => Promise<void>
}

export interface Store<T> {
  ready: Promise<void>

  store(t: T): Promise<void>

  get(idx: number): Promise<T>

  getByType(type: string): Promise<T[]>

  scanAll(scan: Consumer<T>, onError: (err) => void, onComplete: () => void);

  subscribe(types: string[], onEvent: (err?, event?: T) => void): Promise<Subscription>

  subscribeSince(types: string[], offset: number, onEvent: (err?, event?: T) => void): Promise<Subscription>
}
