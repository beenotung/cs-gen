import { Rethinkdb, table as _table } from '../src/lib/cqrs/impl/rethinkdb';
import { later } from '@beenotung/tslib/async/wait';

const rethinkdb = new Rethinkdb({ db: 'test' });
const table = _table('demo');

async function publish() {
  return rethinkdb.run(
    table.insert({ id: 'data' }),
  );
}

async function update() {
  return rethinkdb.run(
    table.update({ id: 'data', result: '123' }),
  );
}

async function subscribe() {
  return rethinkdb.watch(table.get('data'), o => o.subscribe(
    res => console.log('res:', res),
    err => console.error('err:', err),
  ));
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
  .then(() => later(2000))
  .then(() => rethinkdb.close())
;
