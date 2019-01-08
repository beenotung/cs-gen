import { InsertOptions, RDatum, RTable, WriteResult } from 'rethinkdb-ts';

export interface FixedRTable<T> extends RTable<T> {
  insert(obj: any, options?: InsertOptions): RDatum<WriteResult<T>>;
}

export function castTable<T = any>(table: RTable<T>): FixedRTable<T> {
  (table as FixedRTable<T>).ensert = (table as FixedRTable<T>).insert;
  return table as FixedRTable<T>;
}
