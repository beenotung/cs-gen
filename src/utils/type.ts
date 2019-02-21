import { ICommand, IEvent, IQuery } from '../core/data';

/* tslint:disable:no-empty */

export function ensureTypeFulfill<Target extends Base, Base>(): void {
}

export function ensureCommandType<CustomCommand extends ICommand<CustomCommand['command'], CustomCommand['result'], CustomCommand['type']>>(): void {
}

export function ensureEventType<CustomEvent extends IEvent<CustomEvent['data'], CustomEvent['type']>, >(): void {
}

export function ensureQueryType<CustomQuery extends IQuery<CustomQuery['query'], CustomQuery['response'], CustomQuery['type']>>(): void {
}

/* tslint:enable:no-empty */
