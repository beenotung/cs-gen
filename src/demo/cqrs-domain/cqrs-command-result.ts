import { IEvent, INewEvent } from '../core/data-types';
import { CommandHandlingFailed, CqrsDomainEvent, UnknownCommandReceived } from './cqrs-domain-event';

export type InternalCommandResult<Event extends IEvent<Event['event'], Event['type']> = any> =
  [INewEvent<CqrsDomainEvent>] | INewEvent<Event>[]

export type CommandResult<Event extends IEvent<Event['event'], Event['type']> = any> =
  [CqrsDomainEvent] | Event[]
