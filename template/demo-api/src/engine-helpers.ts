import { CallIn, CallOut } from './types'
import { dispatchCall } from './dispatch-call'
import { logicalProcessor } from './instances'
import { dispatchInsert } from './dispatch-insert'

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
  dispatchInsert(timestamp,acc,call)
  const context: Context = { timestamp }
  return dispatchCall(logicalProcessor, call, context)
}
