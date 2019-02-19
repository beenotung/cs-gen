import { remove } from '@beenotung/tslib/array';
import {
  Changes,
  ChangesOptions,
  Connection,
  r,
  RConnectionOptions,
  RFeed,
} from 'rethinkdb-ts';
import { Observable } from 'rxjs/internal/Observable';
import { Subscription } from 'rxjs/internal/Subscription';
import { castTable } from '../../rethinkdb';
import { create } from '../../rxjs/create';
import { tables } from './tables';

export let defaultChangeOptions: ChangesOptions = {
  includeInitial: true,
  includeTypes: true,
};

export function table<T>(tableName: string) {
  return castTable(r.table<T>(tableName));
}

export type RethinkdbOptions = RConnectionOptions & {
  db: string;
};

export class Rethinkdb {
  conn: Promise<Connection>;
  subs: Subscription[] = [];

  constructor(public options: RethinkdbOptions) {
    this.conn = r
      .connect(options)
      .then(conn => this.populateDatabase(conn).then(() => conn));
  }

  run<T>(q: { run: (conn: Connection) => T | Promise<T> }): Promise<T> {
    return this.conn.then(conn => q.run(conn));
  }

  watch<T>(
    q: { changes: (options?: ChangesOptions) => RFeed<Changes<T>> },
    f: (observable: Observable<Changes<T>>) => Subscription,
  ) {
    return this.conn
      .then(conn => q.changes(defaultChangeOptions).run(conn))
      .then(cursor =>
        create<Changes<T>>(observer => {
          cursor.each((err, row) => {
            if (err) {
              observer.error(err);
            } else {
              observer.next(row);
            }
          });
          return () => cursor.close();
        }),
      )
      .then(observable => {
        const sub = f(observable);
        this.subs.push(sub);
        return sub;
      });
  }

  unsubscribe(sub: Subscription) {
    remove(this.subs, sub);
    return sub.unsubscribe();
  }

  async populateDatabase(conn: Connection) {
    await r
      .dbCreate(this.options.db)
      .run(conn)
      .catch(() => 0);
    await Promise.all(
      Object.keys(tables)
        .map(table => tables[table])
        .map(tableName =>
          r
            .tableCreate(tableName)
            .run(conn)
            .catch(() => 0),
        ),
    );
  }

  async close() {
    const ps = this.subs.map(sub => sub.unsubscribe());
    this.subs = [];
    await Promise.all(ps);
    await (await this.conn).close();
  }
}
