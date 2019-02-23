import 'cqrs-exp';
import { IEvent, IQuery, IReadModel, pos_int } from 'cqrs-exp';
import { remove } from '@beenotung/tslib';

function then(p: void | Promise<void>, cb: () => void) {
  if (p && p.then) {
    p.then(() => cb());
  } else {
    cb();
  }
}

export abstract class CommonReadModel<Event extends IEvent<Event['data'], Event['type']>,
  Query extends IQuery<Query['query'], Query['response'], Query['type']>>
  implements IReadModel<Event, Query> {
  abstract timestamp: pos_int;

  abstract handleEvent(events: Event[]): void | Promise<void>

  /**
   * hook to be called after onEvent()
   * */
  onPostEvents: Array<() => void> = [];

  onEvent(events: Event[]): void {
    let res = this.handleEvent(events);
    then(res, () => this.onPostEvents.forEach(f => f()));
  }

  abstract query(query: Query): Promise<Query['response']>

  querySince(query: Query, sinceTimestamp: pos_int): Promise<Query['response']> {
    if (this.timestamp < sinceTimestamp) {
      return this.query(query);
    }
    return new Promise((resolve, reject) => {
      let f = () => {
        if (this.timestamp < sinceTimestamp) {
          this.query(query)
            .then(resolve)
            .catch(reject);
          remove(this.onPostEvents, f);
        }
      };
      this.onPostEvents.push(f);
    });
  }
}
