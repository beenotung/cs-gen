import { Call } from '../types';

export function genEngine(args: {
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  eventTypeName: string;
  callTypes: Call[];
  eventTypes: string[];
}) {
  const {
    callTypeName,
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    eventTypeName,
    callTypes,
    eventTypes,
  } = args;
  const code = `
import { Result, then } from '@beenotung/tslib/result';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as r from 'rethinkdb';
// TODO change path update debug
import { Db } from './src';
import { CallInput } from './src';
import { ${callTypeName}, ${eventTypeName} } from './example/demo-server/src/domain/types'
import { LogicProcessor } from './example/demo-server/src/domain/logic-processor'

export class Dispatcher {
  logicProcessor: LogicProcessor;
  db: Db;
  ready: Promise<void>;
  dbName: string;

  constructor(args: {
    logicProcessor: LogicProcessor;
    db: Db;
    dbName: string;
  }) {
    this.logicProcessor = args.logicProcessor;
    this.db = args.db;
    this.dbName = args.dbName;
    this.ready = this.init();
  }

  // inject logic processor method route below
  private routeMethod<C extends ${callTypeName}>(call: {
    CallType: C['CallType'];
    Type: C['Type'];
  }): (In: C['In']) => C['Out'] {
    const method = (() => {
      const Type: ${callTypeName}['Type'] = call.Type;
      switch (Type) {${callTypes
        .map(
          ({ Type }) => `
        case '${Type}':
          return this.logicProcessor.${Type};`,
        )
        .join('')}
        default: {
          let x: never = Type;
          throw new HttpException(\`not implement call method: CallType=\${x} Type=\${call.Type}\`, HttpStatus.NOT_IMPLEMENTED);
        }
      }
    })();
    return method.bind(this.logicProcessor);
  }
  // injected logic processor method route above

  // inject logic processor event route below
  private routeEvent(event: ${eventTypeName}) {
    const method = (() => {
      const event_type = event.event_type;
      switch (event_type) {${eventTypes
        .map(
          eventType => `
        case '${eventType}':
          return this.logicProcessor.${eventType};`,
        )
        .join('')}
        default: {
          let x: never = event_type;
          throw new HttpException(\`not implement event handler: event_type=\${x}\`, HttpStatus.NOT_IMPLEMENTED);
        }
      }
    })();
    return method.bind(this.logicProcessor)(event);
  }
  // injected logic processor event route above

  /**
   * TODO pass session info
   *   for auth and pub/sub (live query)
   *   current workaround is to ask client pass primus id
   * */
  // inject Call route below
  async ${callTypeName}<C extends ${callTypeName}>(call: CallInput<C>): Promise<C['Out']> {
    return (() => {
      const CallType: C['CallType'] = call.CallType;
      switch (CallType) {
        case '${commandTypeName}':
          return this.${commandTypeName};
        case '${queryTypeName}':
          return this.${queryTypeName};
        case '${subscribeTypeName}':
          return this.${subscribeTypeName};
        default: {
          const x: never = CallType;
          throw new HttpException(\`not implement call type: CallType=\${x}\`, HttpStatus.NOT_IMPLEMENTED);
        }
      }
    })().bind(this)(call);
  }
  // injected Call route above

  private async ${commandTypeName}<C extends ${callTypeName} & { CallType: '${commandTypeName}' }>(
    call: CallInput<C>,
  ): Promise<C['Out']> {
    await this.ready;
    // log command
    await this.runTable('${commandTypeName}', table => table.insert(call));
    const events = this.routeMethod(call)(call.In);
    // log generated events
    await this.runTable('${eventTypeName}', table => table.insert(events));
    return events;
  }

  private async ${queryTypeName}<C extends ${callTypeName} & { CallType: '${queryTypeName}' }>(
    call: CallInput<C>,
  ): Promise<C['Out']> {
    await this.ready;
    // log query
    await this.runTable('${queryTypeName}', table => table.insert(call));
    // await because need to sync read model
    const out = await this.routeMethod(call)(call.In);
    return out;
  }

  private async ${subscribeTypeName}<C extends ${callTypeName} & { CallType: '${subscribeTypeName}' }>(
    call: CallInput<C>,
  ): Promise<C['Out']> {
    await this.ready;
    // log subscribe
    await this.runTable('${subscribeTypeName}', table => table.insert(call));
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
      ['${commandTypeName}', '${queryTypeName}', '${subscribeTypeName}']
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
    const n = await this.runTable('${eventTypeName}', table => table.count());
    let i = 0;
    const cursor = await this.runTable('${eventTypeName}', table => table);
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
        let event: ${eventTypeName} = row;
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
    tableName: '${commandTypeName}' | '${queryTypeName}' | '${subscribeTypeName}' | '${eventTypeName}',
    f: (table: r.Table) => r.Operation<T>,
  ): Promise<T> {
    return this.runDb(db => f(db.table(tableName)));
  }
}
`;
  return code.trim();
}
