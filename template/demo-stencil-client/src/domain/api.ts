import { apiConfig, Call } from './calls';

export function call(call: Pick<Call, 'Type' | 'In'>) {
  return fetch(`http://localhost:${apiConfig.port}/core/Call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(call),
  });
}
