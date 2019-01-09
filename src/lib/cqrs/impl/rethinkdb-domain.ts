import { Changes, r, RDatum, RValue } from 'rethinkdb-ts';
import { domain } from '../models';
import { command_handler, event, event_handler, query_handler } from '../types';
import { Runner } from '../utils';
import { Rethinkdb, table } from './rethinkdb';
import { command_response, query_response, tables } from './tables';
import { Subscription } from 'rxjs/internal/Subscription';

export abstract class RethinkdbDomain<E, C, Q, R,
  ET, CT, QT, RT,
  qh extends query_handler<any, any, any, any>>
  implements domain<E, C, Q, R, ET, CT, QT, RT, qh> {
  abstract name: string;

  abstract event_types: ET[];
  abstract command_types: CT[];
  abstract query_types: QT[];

  abstract event_handler: event_handler<E, ET>;
  abstract command_handler: command_handler<C, E, CT, ET>;
  abstract query_handler: qh;

  eventRunner: Runner;

  constructor(public rethinkdb: Rethinkdb) {
    this.eventRunner = new Runner({ continueWhenError: false });
  }

  /**
   * will never resolve?
   * */
  async start() {
    const watch = <D, T>(tableName, types: T[]) =>
      this.rethinkdb.watch<D>(
        table<D>(tableName)
          .filter(doc => r.expr(types).contains(doc('type'))),
        o => {
          let onNext = (changes: Changes<D>) => {
          };
          const sub = o.subscribe(
            res => {
              console.log('received', tableName, ':', res);
              onNext(res);
            },
            err => {
              console.error('failed to subscribe', tableName, ':', err);
            },
          );
          return (_onNext: (changes: Changes<D>) => void) => {
            onNext = _onNext;
          };
          return sub;
        },
      );
    console.log('sub to command of types:', this.command_types);

    const watchTable = <T>(tableName: string, filter: (doc: RDatum<T>) => RValue<boolean>, onEach: (res: Changes<T>, sub: Subscription) => void) => {
      this.rethinkdb.watch(
        table<T>(tableName).filter(filter),
        o => {
          const sub = o.subscribe(
            res => {
              console.log('received', tableName, ':', res);
              onEach(res, sub);
            },
            error => {
              console.error('failed to subscribe', tableName, ':', error);
            },
          );
          return sub;
        },
      );
    };

    watchTable<event<E, ET>>(tables.event, doc => r.expr(this.event_types).contains(doc('type')), (res, sub) => {
      // FIXME only work on insert type
      this.eventRunner.queue(() => this.event_handler(res.new_val));
    });

    watchTable<command_response<C, CT>>(tables.command_response, doc => r.expr(this.command_types).contains(doc('command')('type')), (res, sub) => {
      const row = res.new_val;
      if (row && !row.ok && !row.error) {
        const errorOrEvents = this.command_handler(row.command);
        if (typeof errorOrEvents === 'string') {
          row.error = errorOrEvents;
        } else {
          row.ok = true;
        }
        this.rethinkdb.run(table(tables.command_response).update(row));
        this.rethinkdb.unsubscribe(sub);
      }
    });

     // TODO query_reponse

    await Promise.all([
      watch<event<E, ET>, ET>(tables.event, this.event_types)
        .then(f => f(res => {
          // FIXME only work on insert type
          this.eventRunner.queue(() => this.event_handler(res.new_val));
        })),
      this.rethinkdb.watch(
        table<command_response<C, CT>>(tables.command_response)
          .filter(doc => r.expr(this.query_types).contains(doc('command')('type'))),
      ).then(o => {
        const sub = o.subscribe(
          res => {
            if (res.new_val && !res.new_val.error && !res.new_val.ok) {
              const errorOrEvents = this.command_handler(res.new_val.command);
              const row = res.new_val;
              if (typeof errorOrEvents === 'string') {
                row.error = errorOrEvents;
              } else {
                row.ok = true;
              }
              this.rethinkdb.run(
                table<command_response<C, CT>>(tables.command_response).update(row),
              );
              sub.unsubscribe();
            }
          },
        );
      }),
      this.rethinkdb.watch(
        table<query_response<Q, R, QT, RT>>(tables.query_response)
          .filter(doc => r.expr(this.query_types).contains(doc('query')('type'))),
      ).then(o => {
        const sub = o.subscribe(
          res => {
            if (res.new_val && !res.new_val.response) {
              this.query_handler(res.new_val.query)
                .catch(err => err instanceof Error ? err.toString() : err)
                .then(response => {
                  const row = res.new_val;
                  row.response = response;
                  this.rethinkdb.run(
                    table(tables.query_response)
                      .update(row),
                  );
                  sub.unsubscribe();
                });
            }
          },
          err => {
            console.error('failed to subscribe query_response pair:', err);
          },
        );
      }),
    ]);
  }
}
