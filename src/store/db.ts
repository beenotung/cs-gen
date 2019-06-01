import * as r from 'rethinkdb';
import { IEvent } from '../types';

export namespace tables {
  export const event: r.Table = r.table('event');
}

export function row<T>(key: string & keyof T) {
  return r.row(key);
}

export class Db {
  conn: Promise<r.Connection>;
  connectionOptions: r.ConnectionOptions;

  get db(): string {
    return this.connectionOptions.db || 'test';
  }

  constructor(args: { connectionOptions: r.ConnectionOptions }) {
    const { connectionOptions } = args;
    this.connectionOptions = connectionOptions;
    this.conn = r.connect(connectionOptions).then(async conn => {
      const db = r.db(this.db);
      const tables = await db.tableList().run(conn);
      if (!tables.includes('event')) {
        await db.tableCreate('event').run(conn);
      }
      return conn;
    });
  }

  /**
   * support reconnect
   * */
  run<T>(op: r.Operation<T>): Promise<T> {
    return this.conn.then(conn => op.run(conn));
  }

  close() {
    return this.conn.then(conn => conn.close());
  }

  storeEvent<E extends IEvent>(event: E) {
    return this.run(tables.event.insert(event));
  }

  storeEvents<E extends IEvent>(events: E[]) {
    return this.run(tables.event.insert(events));
  }

  subEvents(aggregate_id: string): Promise<r.Cursor> {
    const filter = row<IEvent>('aggregate_id').eq(aggregate_id);
    const changesOptions: r.ChangesOptions = {} as any;
    changesOptions.includeInitial = true;
    const op = tables.event.filter(filter).changes(changesOptions);
    return this.run(op);
  }
}
