import { db } from './config'
import type { IntLike } from 'integer'
import { CallIn, Call } from '../types'
import { toTsTypeName } from '../../macro-helpers/gen-ts-type'
import { callMetas } from '../../config/call-meta'
import * as i from './insert-logs'

type InsertFns = typeof i
const insertFnNameById = {} as Record<Call['id'], keyof InsertFns>

callMetas.forEach(call => {
  const id = call.id as Call['id']
  insertFnNameById[id] = ('insert' + toTsTypeName(call.type)) as keyof InsertFns
})

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
  call: CallIn,
): IntLike {
  const log_id = insert_log.run({ timestamp, acc, meta_id: call.id })
    .lastInsertRowid
  if (!call.id) {
    // skip insert body for empty input
    return log_id
  }
  const fnName = insertFnNameById[call.id]
  if (!i[fnName]) {
    console.error('unknown call_meta.id:', call.id)
    throw new Error('unknown call_meta.id')
  }
  i[fnName](log_id, call.in as any)
  return log_id
}
