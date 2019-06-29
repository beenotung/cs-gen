import { usePrimus } from './api';

let acc = 0;

/**
 * TODO change to use device id, so can work in offline
 * */
export function nextId(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    usePrimus(primus =>
      primus.id(id => {
        acc++;
        resolve(id + '-' + acc);
      }),
    );
  });
}
