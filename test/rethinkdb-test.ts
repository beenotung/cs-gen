import { InsertOptions, r, RDatum, RTable, WriteResult } from 'rethinkdb-ts';

export interface FixedRTable<T> extends RTable<T> {
  insert(obj: any, options?: InsertOptions): RDatum<WriteResult<T>>;
}

function castTable<T = any>(table: RTable<T>): FixedRTable<T> {
  (table as FixedRTable<T>).ensert = (table as FixedRTable<T>).insert;
  return table as FixedRTable<T>;
}

r.connect({
  db: 'test',
}).then(conn => {
  // return castTable(r.table('data')).insert({ id: 'test' }).run(conn);
  // r.insert(r.table('data'), { id: 'test2' }).run(conn);
  // return castTable(r.table('data')).insert([{ id: 'test3' }, { id: 'test4' }]).run(conn).then(() => conn.close());
  r.insert(r.table('data'), [{ id: 'test5', new: true }, { id: 'test6' }]).run(conn).then(() => conn.close());
});
