import { Result, then } from '@beenotung/tslib/result';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as r from 'rethinkdb';
import { Db } from './store/db';
import { Call, Call as _Call, IEvent } from './types';
import { CallInput } from './utils';

export interface LogicProcessor<C extends Call> {
  [Type: string]: (In: Call['In']) => Call['Out'];
}

/**
 * this is a template
 * it should be generated for each application since they may name CallType differently
 * */
export class Dispatcher<Call extends _Call = _Call> {
  logicProcessor: LogicProcessor<Call>;
  db: Db;
  ready: Promise<void>;
  dbName: string;

  constructor(args: {
    logicProcessor: LogicProcessor<Call>;
    db: Db;
    dbName: string;
  }) {
    this.logicProcessor = args.logicProcessor;
    this.db = args.db;
    this.dbName = args.dbName;
    this.ready = this.init();
  }

  // injected logic processor event route above

  // TODO pass session info, for auth and pub/sub (live query)
  // inject Call route below
  async Call<C extends Call>(call: CallInput<C>): Promise<C['Out']> {
    return (() => {
      switch (call.CallType) {
        case 'Command':
          return this.Command;
        case 'Query':
          return this.Query;
        case 'Subscribe':
          return this.Subscribe;
        default:
          throw new HttpException(
            `not implement call type: CallType=${call.CallType}`,
            HttpStatus.NOT_IMPLEMENTED,
          );
      }
    })().bind(this)(call);
  }

  // inject logic processor method route below
  private routeMethod<C extends Call>(call: {
    CallType: C['CallType'];
    Type: C['Type'];
  }): (In: C['In']) => C['Out'] {
    const method = this.logicProcessor[call.Type as string];
    if (typeof method !== 'function') {
      throw new HttpException(
        `not implement call method: CallType=${call.CallType} Type=${call.Type}`,
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    return method.bind(this.logicProcessor);
  }

  // injected logic processor method route above

  // inject logic processor event route below
  private routeEvent(event: IEvent) {
    const method = this.logicProcessor[event.event_type];
    if (typeof method !== 'function') {
      throw new HttpException(
        `not implement event handler: event_type=${event.event_type}`,
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    return method.bind(this.logicProcessor)(event);
  }

  // injected Call route above

  private async Command<C extends Call & { CallType: 'Command' }>(
    call: CallInput<C>,
  ): Promise<C['Out']> {
    await this.ready;
    // log command
    await this.runTable('Command', table => table.insert(call));
    const events = this.routeMethod(call)(call.In);
    // log generated events
    await this.runTable('Event', table => table.insert(events));
    return events;
  }

  private async Query<C extends Call & { CallType: 'Query' }>(
    call: CallInput<C>,
  ): Promise<C['Out']> {
    await this.ready;
    // log query
    await this.runTable('Query', table => table.insert(call));
    // await because need to sync read model
    const out = await this.routeMethod(call)(call.In);
    return out;
  }

  private async Subscribe<C extends Call & { CallType: 'Subscribe' }>(
    call: CallInput<C>,
  ): Promise<C['Out']> {
    await this.ready;
    // log subscribe
    await this.runTable('Subscribe', table => table.insert(call));
    const out = this.routeMethod(call)(call.In);
    // TODO log how long each subscription last
    return out;
  }

  private async init() {
    const dbList = await this.db.run(r.dbList());
    if (!dbList.includes(this.dbName)) {
      await this.db.run(r.dbCreate(this.dbName));
    }
    const tableList = await this.runDb(db => db.tableList());
    await Promise.all(
      ['Command', 'Query', 'Subscribe']
        .filter(CallType => !tableList.includes(CallType))
        .map(CallType => this.runDb(db => db.tableCreate(CallType))),
    );
    await this.restore();
  }

  /**
   * this method should load events and dispatch to logic processor
   * (instead of replay commands, should replay events)
   * */
  private async restore() {
    const n = await this.runTable('Event', table => table.count());
    let i = 0;
    const cursor = await this.runTable('Event', table => table);
    let eventP: Result<void> = void 0;
    return new Promise((resolve, _reject) => {
      const reject = err => {
        cursor.close();
        _reject(err);
      };
      cursor.each((err, row) => {
        if (err) {
          reject(err);
          return;
        }
        const event: IEvent = row;
        eventP = then(eventP, () => this.routeEvent(event), err => reject(err));
        i++;
        if (i >= n) {
          resolve();
        }
      });
    });
  }

  private runDb<T>(f: (db: r.Db) => r.Operation<T>): Promise<T> {
    return this.db.run(f(r.db(this.dbName)));
  }

  private runTable<T>(
    tableName: 'Command' | 'Query' | 'Subscribe' | 'Event',
    f: (table: r.Table) => r.Operation<T>,
  ): Promise<T> {
    return this.runDb(db => f(db.table(tableName)));
  }
}
