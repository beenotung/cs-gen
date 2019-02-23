import { IEvent } from './data';

export type HttpStatusCode = number;
export type CommonCommandResult =
  'ok'
  | 'timeout'
  | 'quota_excess'
  | 'no_permission'
  | 'version_conflict'
  | HttpStatusCode
  ;

export type SaveEventResult<Event extends IEvent<Event['data'], Event['type']>> =
  { ok: Event[] }
  | 'version_conflict'
  | HttpStatusCode
  ;
