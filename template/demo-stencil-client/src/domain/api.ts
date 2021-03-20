import { apiConfig, Call } from './calls';

export function call<C extends Call>(Type: C['Type'], In: C['In']) {
  return fetch(`http://localhost:${apiConfig.port}/core/Call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Type, In }),
  }).then(res => res.json().then((out: C['Out']) => out));
}
