export type HttpStatusCode = number;
export type CommonCommandResult = 'ok' |
  'timeout' |
  'quota_excess' |
  'no_permission' |
  'version_conflict' |
  HttpStatusCode;

export type SaveEventResult = 'ok' |
  'version_conflict' |
  HttpStatusCode;
