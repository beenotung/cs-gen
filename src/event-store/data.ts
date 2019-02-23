/**
 * for internal usage by IEventStore
 * */
import { pos_int } from '../core/type';

export interface IEventMeta {
  aggregate_id: string
  /**
   * starts from 1
   * version 0 means no record for this aggregate yet
   * */
  last_version: pos_int
}
