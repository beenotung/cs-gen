import DB from 'better-sqlite3';
import { IntLike } from 'integer';
export type DBInstance = ReturnType<typeof DB>;

export function example(db: DBInstance) {
  db.exec(genCreateTableIfNotExists('str', [['val', 'text unique']]));
  const getStrId = genGetStrIdWithCache(db, 'str', 'val');

  db.exec(genCreateTableIfNotExists('json', [['val', 'text unique']]));
  const getJsonId = genGetStrIdWithCache(db, 'json', 'val');

  const fields: Field[] = [
    // from key
    ['timestamp', 'integer'],
    ['acc', 'integer'],
    ['suffix', 'integer references str(id)'],
    // from call
    ['call_type', 'integer references str(id)'],
    ['type', 'integer references str(id)'],
    // from call.In
    ['in_timestamp', 'integer'],
    ['token', 'integer references str(id)'],
    ['app_id', 'integer references str(id)'],
    ['user_id', 'integer references str(id)'],
    ['user_agent', 'integer references str(id)'],
    ['in_json', 'integer references json(id)'],
  ];
  db.exec(genCreateTableIfNotExists('log', fields));
  const insert = genInsertObjFn(db, 'log', [
    'timestamp',
    'acc',
    'suffix',
    'call_type',
    'type',
    'in_timestamp',
    'token',
    'app_id',
    'user_id',
    'user_agent',
    'in_json',
  ]);

  function insertRow(key: string, value: object | null): IntLike {
    const parts = key.split('-');
    const timestamp = +parts[0];
    const acc = +parts[1];
    const suffix = parts[2] || null;
    if (!value) {
      return insert({
        timestamp,
        acc,
        suffix: getStrId(suffix),
        call_type: null,
        type: null,
        in_timestamp: null,
        token: null,
        app_id: null,
        user_id: null,
        user_agent: null,
        in_json: null,
      });
    }
    const {
      CallType,
      Type,
      Timestamp,
      token,
      app_id,
      user_id,
      user_agent,
      ...In,
    } = value as any;
    return insert({
      timestamp,
      acc,
      suffix: getStrId(suffix),
      call_type: getStrId(CallType),
      type: getStrId(Type),
      in_timestamp: Timestamp,
      token: getStrId(token),
      app_id: getStrId(app_id),
      user_id: getStrId(user_id),
      user_agent: getStrId(user_agent),
      in_json: getJsonId(In),
    });
  }
  return insertRow;
}

type Name = string;
type Type = string;
export type Field = [Name, Type];

export function genCreateTableIfNotExists(table: string, fields: Field[]) {
  const body = fields.map(([name, type]) => `${name} ${type}`).join(',');
  const sql = `create table if not exists ${table} (${body})`;
  return sql;
}

export function genGetStrIdWithCache(
  db: DBInstance,
  table: string,
  field: string,
) {
  const select = db.prepare(genSelectStr(table, field));
  const insert = db.prepare(genInsertStr(table, field));
  const cache = {} as any;
  const name = `cached_get_${field}_id`;
  return {
    [name](value: string | null | undefined): IntLike | null {
      if (value === null || value === undefined) {
        return null;
      }
      if (value in cache) {
        return cache[value];
      }
      const row = select.get(value);
      return (cache[value] = row ? row.id : insert.run(value).lastInsertRowid);
    },
  }[name];
}

export function genGetStrId(db: DBInstance, table: string, field: string) {
  const select = db.prepare(genSelectStr(table, field));
  const insert = db.prepare(genInsertStr(table, field));
  const name = `get_${field}_id`;
  return {
    [name](value: string | null | undefined): IntLike | null {
      if (value === null || value === undefined) {
        return null;
      }
      const row = select.get(value);
      return row ? row.id : insert.run(value).lastInsertRowid;
    },
  }[name];
}

export function genSelectStr(table: string, field: string) {
  const sql = `select id from ${table} where ${field} = ?`;
  return sql;
}

export function genInsertStr(table: string, field: string) {
  const sql = `insert into ${table} (${field}) values (?)`;
  return sql;
}

export function genInsertObj(table: string, fields: string[]) {
  const col = fields.join(',');
  const val = fields.map(field => ':' + field).join(',');
  const sql = `insert into ${table} (${col}) values (${val})`;
  return sql;
}

export function genInsertObjFn<T>(
  db: DBInstance,
  table: string,
  fields: Array<keyof T>,
) {
  const insert = db.prepare(genInsertObj(table, fields as string[]));
  const name = `insert_${table}`;
  return {
    [name](row: T): IntLike {
      return insert.run(row).lastInsertRowid;
    },
  }[name];
}
