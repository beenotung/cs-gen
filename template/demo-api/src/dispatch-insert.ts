import { CallIn, Call } from './types'
import { toTsTypeName } from '../helpers/gen-ts-type'
import { callMetas } from '../config/call-meta'
import { insertLog } from './db-queries'
import * as i from './insert-logs'

type InsertFns = typeof i
const insertFnNameById = {} as Record<Call['id'], keyof InsertFns>

callMetas.forEach(call => {
  const id = call.id as Call['id']
  insertFnNameById[id] = ('insert' + toTsTypeName(call.type)) as keyof InsertFns
})

export function dispatchInsert(timestamp: number, acc: number, call: CallIn) {
  const log_id = insertLog(timestamp, acc, call.id)
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
