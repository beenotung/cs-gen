import 'cqrs-exp';
import { timestamp, pos_int } from 'cqrs-exp';

export interface CommonEvent {
  aggregate_id: string;
  timestamp: timestamp;
  version: pos_int;
}
