import { db } from '../config/db'
import type { IntLike } from 'integer'

const insert_log = db.prepare(`
  insert into log
  ( timestamp
  , acc
  , meta_id)
  values ( :timestamp
         , :acc
         , :meta_id);`)

export function insertLog(
  timestamp: number,
  acc: number,
  meta_id: number,
): IntLike {
  return insert_log.run({ timestamp, acc, meta_id }).lastInsertRowid
}

const select_str_id = db.prepare(`
  select id
  from str
  where str = ?
`)

const insert_str = db.prepare(`
  insert into str (str)
  values (?)
`)

export function getStrId(str: any) {
  if (str === null || str === undefined) {
    return null
  }
  const row = select_str_id.get(str)
  if (row) {
    return row.id
  }
  return insert_str.run(str).lastInsertRowid
}

export function getJsonId(json: any) {
  if (json === null || json === undefined) {
    return null
  }
  const str = JSON.stringify(json)
  const row = select_str_id.get(str)
  if (row) {
    return row.id
  }
  return insert_str.run(str).lastInsertRowid
}

export function boolToInt(value: boolean | null | undefined): null | number {
  if (value === null || value === undefined) {
    return null
  }
  return value ? 1 : 0
}
