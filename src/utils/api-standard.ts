export interface ApiStandard<T> {
  statusCode: number;
  reason?: string;
  data?: T;
}

export function apiSuccess<T>(data: T): ApiStandard<T> {
  return {
    statusCode: 200,
    data,
  };
}

export function apiFail(statusCode: number, reason?: string): ApiStandard<any> {
  return {
    statusCode,
    reason,
  };
}
