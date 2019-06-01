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

  constructor(args: { connectionOptions: r.ConnectionOptions }) {
    const { connectionOptions } = args;
    this.conn = r.connect(connectionOptions);
  }

  /**
   * support reconnect
   * */
  run<T>(op: r.Operation<T>): Promise<T> {
    return this.conn.then(conn => op.run(conn));
  }

  storeEvent<E extends IEvent>(event: E) {
    return this.run(tables.event.insert(event));
  }

  storeEvents<E extends IEvent>(events: E[]) {
    return this.run(tables.event.insert(events));
  }

  subEvents(aggregate_id: string) {
    const filter = row<IEvent>('aggregate_id').eq(aggregate_id);
    const changesOptions: r.ChangesOptions = {} as any;
    changesOptions.includeInitial = true;
    const op = tables.event.filter(filter).changes(changesOptions);
    return this.run(op);
  }
}
