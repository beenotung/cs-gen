import { later } from '@beenotung/tslib/async/wait';
import { format_datetime } from '@beenotung/tslib/format';
import { r } from 'rethinkdb-ts';
import { Rethinkdb, table as _table } from '../src/lib/cqrs/impl/rethinkdb';
import { command_response } from '../src/lib/cqrs/impl/tables';

const rethinkdb = new Rethinkdb({ db: 'test' });
const table = _table<command_response<any, string>>('demo');

async function publish() {
  const row = {} as command_response<any, string>;
  row.command = {
    type: 'sendTest',
    data: format_datetime(Date.now()),
    expected_version: 0,
    aggregate_id: '123',
  };
  return rethinkdb.run(
    table.insert(row),
  );
}

async function update() {
  // return rethinkdb.run(
  //   table.update({ id: 'data', result: '123' }),
  // );
  return 'not_impl';
}

async function subscribe() {
  return rethinkdb.watch(
    table
      .filter(doc => r.expr(['sendTest']).contains(doc('command')('type')))
      .without('ok', 'error'),
    o => {
      const sub = o.subscribe(
        res => {
          if (res.type === 'initial' || res.type === 'add') {
            const row = res.new_val;
            console.log('new cmd:', res);
          }
        },
        err => console.error('err:', err),
      );
      return sub;
    },
  );
}

async function init() {
  return rethinkdb.run(
    table.delete(),
  );
}

subscribe()
  .then(init)
  .then(publish)
  .then(update)
  .then(() => later(5000))
  .then(() => rethinkdb.close())
;
