import { compare_number } from '@beenotung/tslib/number';
import { Connection, r } from 'rethinkdb-ts';
import { fromPromise } from 'rxjs/internal-compatibility';
import { Observable } from 'rxjs/internal/Observable';
import { mergeAll, mergeMap } from 'rxjs/operators';
import { castTable } from '../../rethinkdb';
import { create } from '../../rxjs/create';
import { Changes, event_filter, event_store } from '../models';
import { event, id, seq } from '../types';
import { version_mismatch } from '../values';

export interface RethinkdbEventstoreOptions {
  /**@deprecated*/
  aggregateTable: string,
  eventTable: string,
  connection: Promise<Connection>,
}


export class RethinkdbEventstore<E, ET> implements event_store<E, ET> {
  conn: Promise<Connection>;

  constructor(public options: RethinkdbEventstoreOptions) {
    this.conn = options.connection;
  }

  /* custom methods */

  run<T>(q: { run: (conn: Connection) => T | Promise<T> }): Promise<T> {
    return this.conn.then(conn => q.run(conn));
  }

  table() {
    return castTable(r.table<event<E, ET>>(this.options.eventTable));
  }

  filter(filter: event_filter<ET>) {
    const selector = {} as event<E, ET>;
    let selectorN = 0;
    if (filter.aggregate_id) {
      selector.aggregate_id = filter.aggregate_id;
      selectorN++;
    }
    if (filter.type) {
      selector.type = filter.type;
      selectorN++;
    }
    let q = this.table();
    if (selectorN > 0) {
      q = q.filter(selector);
    }
    if (filter.since) {
      q = q.filter(doc => doc('version').ge(filter.since));
    }
    return q;
  }

  lastVersion(aggregate_id: id) {
    return this.table()
      .filter({ aggregate_id })
      .getField('version')
      .max({ index: 'version' })
      ;
  }

  /* event_store impl */

  listAggregateIds(): Promise<id[]> {
    return this.run(
      this.table()
        .getField('aggregate_id')
        .distinct()
        .coerceTo('array'),
    );
  }

  getLastVersion(aggregate_id: id): Promise<seq> {
    return this.run(this.lastVersion(aggregate_id));
  }

  listEvents(filter: event_filter<ET>): Promise<Array<event<E, ET>>> {
    return this.run(this.filter(filter).coerceTo('array'));
  }

  scanEvents(filter: event_filter<ET>): Observable<event<E, ET>> {
    return fromPromise(this.conn)
      .pipe(mergeMap(conn => this.filter(filter).run(conn)))
      .pipe(mergeAll());
  }

  storeEvents(events: Array<event<E, ET>>, expected_version: seq): Promise<void> {
    if (events.length === 0) {
      return;
    }
    events.sort((a, b) => compare_number(a.version, b.version));
    if (events[0].version !== expected_version - 1) {
      throw new Error('events not in order');
    }
    for (let i = 1; i < events.length; i++) {
      if (events[i - 1].version !== events[i].version - 1) {
        throw new Error('events not in order');
      }
    }
    this.run(
      r.branch(
        this.lastVersion(events[0].aggregate_id).eq(expected_version),
        this.table().insert(events),
        r.expr(version_mismatch),
      ),
    ).then(res => {
      if (res === version_mismatch) {
        return Promise.reject(res);
      } else {
        return res;
      }
    });
  }

  subscribeEvents(filter: event_filter<ET>): Observable<Changes<event<E, ET>>> {
    return fromPromise(this.conn)
      .pipe(mergeMap(conn => create<Changes<event<E, ET>>>(observer => {
        this.filter(filter)
          .changes()
          .run(conn)
          .then(cursor => {
            cursor.each((error, result) => {
              if (error) {
                observer.error(error);
              } else {
                observer.next(result);
              }
            });
          });
      })));
  }
}
