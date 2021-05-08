import { CallIn, CallOut } from './types'
import { storeLog } from './insert-logs'
import { applyCall } from './apply-call'
import { logicalProcessor } from './instances'

export interface Context {
  timestamp: number
}

export function storeAndCall(call: CallIn): CallOut {
  const timestamp = Date.now()
  storeCall(call, timestamp)
  const context: Context = { timestamp }
  return applyCall(logicalProcessor, call, context)
}

let lastTimestamp = 0
let acc = 0

function storeCall(call: CallIn, timestamp: number) {
  if (timestamp === lastTimestamp) {
    acc++
  } else {
    lastTimestamp = timestamp
    acc = 0
  }
  storeLog(timestamp, acc, call)
}
