import * as r from 'rethinkdb';
import { Expression } from '../lib/rethinkdb';
import { ICommand, IEvent } from '../types';
import { EventSelector } from './types';

export namespace tables {
  export const command: r.Table = r.table('command');
  export const event: r.Table = r.table('event');
}

export function row<T>(key: string & keyof T) {
  return r.row(key);
}

export class Db {
  conn: Promise<r.Connection>;
  connectionOptions: r.ConnectionOptions;
  cursorSessions = new Map<r.Cursor, boolean>();

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

  async close() {
    const cursors = Array.from(this.cursorSessions.keys());
    await Promise.all(cursors.map(c => c.close()));
    const conn: r.Connection = await this.conn;
    await conn.close();
  }

  storeCommand<C extends ICommand>(command: C) {
    return this.run(tables.command.insert(command));
  }

  storeEvent<E extends IEvent>(event: E) {
    return this.run(tables.event.insert(event));
  }

  storeEvents<E extends IEvent>(events: E[]) {
    return this.run(tables.event.insert(events));
  }

  selectEvents(selector: EventSelector): r.Sequence {
    let filter = row<IEvent>('aggregate_id').eq(selector.aggregate_id);
    if (selector.command_id) {
      filter = filter.eq(selector.command_id);
    }
    if (selector.version) {
      const version = selector.version;
      const rowExpr = row<IEvent>('version');
      switch (version.split('.').length) {
        case 1:
        case 2:
          filter = filter.and(Expression.cast(rowExpr).match(
            '^' + version + '\\.',
          ) as Expression<boolean>);
          break;
        case 3:
          filter = filter.and(rowExpr.eq(version));
          break;
        default:
          throw new TypeError('invalid version: ' + selector.version);
      }
    }
    if (selector.event_types) {
      const rowExpr = row<IEvent>('event_type');
      let accExpr =
        selector.event_types.length === 0
          ? rowExpr.not()
          : rowExpr.eq(selector.event_types[0]);
      for (let i = 1; i < selector.event_types.length; i++) {
        accExpr = accExpr.or(rowExpr.eq(selector.event_types[i]));
      }
      filter = filter.and(accExpr);
    }
    return tables.event.filter(filter);
  }

  async getEventsCount(selector: EventSelector): Promise<number> {
    const seq = this.selectEvents(selector);
    return await this.run(seq.count());
  }

  async subEvents(selector: EventSelector): Promise<r.Cursor> {
    const seq = this.selectEvents(selector);
    const changesOptions: r.ChangesOptions = {} as any;
    changesOptions.includeInitial = true;
    let op = seq.changes(changesOptions);
    if (selector.skip) {
      op = op.skip(selector.skip);
    }
    const cursor = await this.run(op);
    const realClose = cursor.close;
    cursor.close = async () => {
      const hasClose = this.cursorSessions.get(cursor);
      if (hasClose) {
        return;
      }
      this.cursorSessions.set(cursor, true);
      return realClose.call(cursor);
    };
    this.cursorSessions.set(cursor, false);
    return cursor;
  }
}
