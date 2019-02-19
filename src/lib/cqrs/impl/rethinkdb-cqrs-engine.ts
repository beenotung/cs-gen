import { cqrs_engine } from '../models';
import { command, query, query_handler, response } from '../types';
import { Rethinkdb, table } from './rethinkdb';
import { command_response, query_response, tables } from './tables';

export class RethinkdbCqrsEngine<
  E,
  C,
  Q,
  R,
  ET,
  CT,
  QT,
  RT,
  qh extends query_handler<any, any, any, any>
> implements cqrs_engine<E, C, Q, R, ET, CT, QT, RT, qh> {
  requestQueryResponse: qh;

  constructor(public rethinkdb: Rethinkdb) {
    this.requestQueryResponse = (async (query: query<Q, QT>) => {
      const conn = await rethinkdb.conn;
      const data = {} as query_response<Q, R, QT, RT>;
      data.query = query;
      const tableQ = table<query_response<Q, R, QT, RT>>(tables.query_response);
      const res = await tableQ.insert(data).run(conn);
      if (res.generated_keys.length !== 1) {
        console.error('failed to store query_response pair');
        return Promise.reject(res);
      }
      const id = res.generated_keys[0];
      return new Promise<response<R, RT>>((resolve, reject) => {
        this.rethinkdb.watch(tableQ.get(id), o => {
          const sub = o.subscribe(
            res => {
              console.log('waiting query result:', res);
              if (res.new_val && res.new_val.response) {
                resolve(res.new_val.response);
                this.rethinkdb.unsubscribe(sub);
              }
            },
            err => {
              reject(err);
              console.error('failed to get query result:', err);
              this.rethinkdb.unsubscribe(sub);
            },
          );
          return sub;
        });
      });
    }) as any;
  }

  sendCommand(command: command<C, CT>): Promise<void> {
    console.log('send command:', command);
    const row = {} as command_response<C, CT>;
    row.command = command;
    return this.rethinkdb
      .run(table<command_response<C, CT>>(tables.command_response).insert(row))
      .then(res => console.log('stored command:', res.generated_keys));
  }
}
