/**
 * for internal usage by IEventStore
 * */
import { pos_int } from '../core/type';

export interface IEventMeta {
  aggregate_id: string
  last_version: pos_int
}
