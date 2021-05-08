import { CallIn, CallOut } from './types'
import { dispatchCall } from './dispatch-call'
import { logicalProcessor } from './instances'
import { insertLog } from './db/insert-helpers'
import { iterateLogs } from './db/select-helpers'

export interface Context {
  timestamp: number
}

let lastTimestamp = 0
let acc = 0

export function storeAndCall(call: CallIn): CallOut {
  const timestamp = Date.now()
  if (timestamp === lastTimestamp) {
    acc++
  } else {
    lastTimestamp = timestamp
    acc = 0
  }
  insertLog(timestamp, acc, call)
  const context: Context = { timestamp }
  return dispatchCall(logicalProcessor, call, context)
}

export function replayLogs() {
  iterateLogs((call, context) => {
    dispatchCall(logicalProcessor, call, context)
  })
}
