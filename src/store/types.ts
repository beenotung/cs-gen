import { IEvent } from '../types';

export interface EventSelector {
  aggregate_id: IEvent['aggregate_id'];
  skip?: number;
  command_id?: IEvent['command_id'];
  version?: IEvent['version'];
  event_types?: Array<IEvent['event_type']>;
}
