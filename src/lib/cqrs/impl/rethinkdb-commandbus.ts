import { Connection, r } from 'rethinkdb-ts';
import { Changes, command_bus, command_filter } from '../models';
import { command, id } from '../types';
import { Observable } from 'rxjs/internal/Observable';
import { castTable } from '../../rethinkdb';
import { version_mismatch } from '../values';
import { fromPromise } from 'rxjs/internal-compatibility';
import { mergeMap } from 'rxjs/operators';
import { create } from '../../rxjs/create';

export interface RethinkdbCommandbusOptions {
  commandTable: string
  connection: Promise<Connection>
}

export class RethinkdbCommandbus<C, CT> implements command_bus<C, CT> {
  conn: Promise<Connection>;

  constructor(public options: RethinkdbCommandbusOptions) {
    this.conn = options.connection;
  }

  /* custom methods */

  run<T>(q: { run: (conn: Connection) => T | Promise<T> }): Promise<T> {
    return this.conn.then(conn => q.run(conn));
  }

  table() {
    return castTable(r.table<command<C, CT>>(this.options.commandTable));
  }

  filter(filter: command_filter<CT>) {
    const selector = {} as command<C, CT>;
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
      q = q.filter(doc => doc('expected_version').gt(filter.since));
    }
    return q;
  }

  lastVersion(aggregate_id: id) {
    return this.table()
      .filter({ aggregate_id })
      .max('expected_version' as any)
      .add(1)
      .default(0)
      ;
  }

  /* command_bus impl */

  async sendCommand(command: command<C, CT>): Promise<void> {
    return this.run(
      r.branch(
        this.lastVersion(command.aggregate_id).eq(command.expected_version),
        this.table().insert(command),
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

  subscribeCommand(filter: command_filter<CT>): Observable<Changes<command<C, CT>>> {
    return fromPromise(this.conn)
      .pipe(mergeMap(conn => create<Changes<command<C, CT>>>(observer => {
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
