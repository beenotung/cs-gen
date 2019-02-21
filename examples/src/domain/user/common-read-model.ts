import 'cqrs-exp';
import { ID, IEvent, IEventStore, IQuery, IReadModel, pos_int } from 'cqrs-exp';
import { createDefer, Defer } from '@beenotung/tslib/async/defer';
import { compare_number } from '@beenotung/tslib/number';

export interface PendingQuery<
  Query extends IQuery<Query['query'], Query['response'], Query['type']>
> {
  query: Query;
  sinceTimestamp: pos_int;
  defer: Defer<Query, any>;
}

export abstract class CommonReadModel<
  State,
  Event extends IEvent<Event['data'], Event['type']>,
  Query extends IQuery<Query['query'], Query['response'], Query['type']>,
  AT extends ID
> implements IReadModel<State, Event, Query, AT> {
  abstract aggregate_type: AT;
  abstract eventStore: IEventStore;
  abstract queryTypes: Array<Query['type']>;
  abstract state: State;
  abstract timestamp: pos_int;

  pendingQueries: Array<PendingQuery<Query>> = [];

  abstract customHandleEvents(events: Event[]): Promise<void>;

  abstract handleQuery(query: Query): Promise<Query>;

  handleEvents(events: Event[]): Promise<void> {
    events = events.sort((a, b) => compare_number(a.version, b.version));
    return this.customHandleEvents(events).then(x => {
      this.pendingQueries = this.pendingQueries.filter(pendingQuery => {
        if (this.timestamp >= pendingQuery.sinceTimestamp) {
          this.handleQuery(pendingQuery.query)
            .then(x => pendingQuery.defer.resolve(x))
            .catch(e => pendingQuery.defer.reject(e));
          return false;
        }
        return true;
      });
      return x;
    });
  }

  handleQuerySince(query: Query, sinceTimestamp: pos_int): Promise<Query> {
    let defer = createDefer<any, any>();
    this.pendingQueries.push({ query, sinceTimestamp, defer });
    return defer.promise;
  }
}
