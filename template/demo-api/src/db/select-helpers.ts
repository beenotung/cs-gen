import { db } from '../../config/db'
import { Call, CallIn } from '../types'
import { Context } from '../engine-helpers'
import { callMetas } from '../../config/call-meta'
import * as s from './select-logs'
import { toTsTypeName } from '../../helpers/gen-ts-type'

type SelectFns = typeof s
const selectFnNameById = {} as Record<Call['id'], keyof SelectFns>

callMetas.forEach(call => {
  const id = call.id as Call['id']
  selectFnNameById[id] = ('select' + toTsTypeName(call.type)) as keyof SelectFns
})

const select_logs = db.prepare(`
  select log.id,
         log.meta_id,
         log.timestamp
  from log
         inner join log_meta on log.meta_id = log_meta.id
  where log_meta.replay = true
  order by timestamp asc, acc asc
`)

export function iterateLogs(eachFn: (call: CallIn, context: Context) => void) {
  const logs = select_logs.all()
  logs.forEach(log => {
    const id = log.meta_id as Call['id']
    const fnName = selectFnNameById[id]
    if (!fnName) {
      console.error('unknown log.meta_id:', id)
      throw new Error('unknown log.meta_id')
    }
    const input = !s[fnName]
      ? void 0 // skip select body for empty input
      : s[fnName](log.id)
    eachFn({ id, in: input } as CallIn, { timestamp: log.timestamp })
  })
}
