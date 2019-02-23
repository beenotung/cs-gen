import { ICommand, IEvent, IQuery } from '../core/data';

/* tslint:disable:no-empty */

export function ensureTypeFulfill<Target extends Base, Base>(): void {
}

export function ensureCommandType<Command extends ICommand<Command['command'], Command['result'], Event, Command['type']>,
  Event extends IEvent<Event['data'], Event['type']>>(): void {
}

export function ensureEventType<CustomEvent extends IEvent<CustomEvent['data'], CustomEvent['type']>, >(): void {
}

export function ensureQueryType<Query extends IQuery<Query['query'], Query['response'], Query['type']>>(): void {
}

/* tslint:enable:no-empty */
