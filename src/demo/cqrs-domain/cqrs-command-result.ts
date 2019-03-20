import { IEvent, INewEvent } from '../core/data-types';
import { CqrsDomainEvent } from './cqrs-domain-event';

export type InternalCommandResult<Event extends IEvent<Event['event'], Event['type']> = any> =
  [INewEvent<CqrsDomainEvent>] | Array<INewEvent<Event>>;

export type CommandResult<Event extends IEvent<Event['event'], Event['type']> = any> =
  [CqrsDomainEvent] | Event[];
