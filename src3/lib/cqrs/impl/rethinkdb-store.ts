import { Consumer } from '@beenotung/tslib/functional/types';
import { Connection, r, RConnectionOptions } from 'rethinkdb-ts';
import { Store, Subscription } from '../store';
import { typed_data } from '../types';

export class RethinkdbStore implements Store<typed_data> {
  ready: Promise<void>;
  conn: Promise<Connection>;

  constructor(public readonly options: RConnectionOptions & { table: string }) {
    this.conn = r.connect(options);
    this.ready = Promise.all([
      this.run(conn => r.wait({ waitFor: 'ready_for_writes' } as any).run(conn)),
      this.run(conn => r.wait({ waitFor: 'ready_for_reads' } as any).run(conn)),
    ]).then(() => void 0);
    // this.ready = this.run(conn => r.tableCreate(options.table).run(conn)).then(() => void 0);
  }

  getByType(type: string): Promise<typed_data[]> {
    const selector = {} as typed_data;
    selector.type = type;
    return this.run(conn => this.table().filter(selector).run(conn));
  }

  store(t: typed_data): Promise<void> {
    return this.run(conn => this.table().insert(t).run(conn)).then(() => void 0);
  }

  subscribe(type: string, onEvent: (err?, event?: typed_data) => void): Promise<Subscription> {
    const selector = {} as typed_data;
    selector.type = type;
    return this.run(conn => this.table().filter(selector).changes().run(conn)).then(q => {
      q.each(onEvent);
      return q;
    });
  }

  scanAll(scan: Consumer<typed_data>, onError: (err) => void, onComplete: () => void) {
    return this.run(conn => this.table().run()).then(q => {
      q.forEach(scan);
      onComplete();
    }).catch(onError);
  }

  table() {
    return r.table(this.options.table);
  }

  run<T>(f: (conn: Connection) => T | Promise<T>): Promise<T> {
    return this.conn.then(conn => f(conn));
  }

}
