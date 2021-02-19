import { Callback } from './types';

export interface AsyncSyncLogStore {
  store(): Promise<void>;
}

export interface SyncLogStore {
  store(cb: Callback<void>): void;
}
