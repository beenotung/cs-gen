import { db } from './config'
import type { IntLike } from 'integer'

const select_str_id = db.prepare(`
  select id
  from str
  where str = ?
`)

const insert_str = db.prepare(`
  insert into str (str)
  values (?)
`)

const str_to_id_cache: Record<string, IntLike> = {}

function cachedGetStrId(str: string) {
  if (str in str_to_id_cache) {
    return str_to_id_cache[str]
  }
  const row = select_str_id.get(str)
  const id = row ? row.id : insert_str.run(str).lastInsertRowid
  str_to_id_cache[str] = id
  id_to_str_cache[id] = str
  return id
}

export function getStrId(str: string | null | undefined) {
  if (str === null || str === undefined) {
    return null
  }
  return cachedGetStrId(str)
}

export function getJsonId(json: any) {
  if (json === null || json === undefined) {
    return null
  }
  const str = JSON.stringify(json)
  return cachedGetStrId(str)
}

const select_str_val = db.prepare(`
  select str
  from str
  where id = ?
`)

const id_to_str_cache: Record<string, string> = {}

function cachedGetStrVal(id: IntLike): string | null {
  if ((id as string) in id_to_str_cache) {
    return id_to_str_cache[id as string]
  }
  const row = select_str_val.get(id)
  if (!row) {
    return null
  }
  const str = row.str
  id_to_str_cache[id as string] = str
  str_to_id_cache[str] = id
  return str
}

export function getStrVal(id: IntLike | null | undefined): string | null {
  if (id === null || id === undefined) {
    return null
  }
  return cachedGetStrVal(id)
}

export function getJsonVal(id: IntLike | null | undefined): string | null {
  if (id === null || id === undefined) {
    return null
  }
  const str = cachedGetStrVal(id)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return JSON.parse(str!)
}
