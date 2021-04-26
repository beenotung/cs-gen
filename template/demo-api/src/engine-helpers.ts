import { CallIn, CallOut } from './types'
import { storeLog } from './insert-logs'
import { logicalProcessor } from './instances'

export interface Context {
  timestamp: number
}

export function storeAndCall(call: CallIn): CallOut {
  const timestamp = Date.now()
  storeCall(call, timestamp)
  const context: Context = { timestamp }
  return applyCall(call, context)
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

// TODO generate this dispatcher
function applyCall(call: CallIn, context: Context): CallOut {
  switch (call.id) {
    case 1:
      return logicalProcessor.createUser(call.in, context)
    default:
      return { error: 'unknown call type' } as any
  }
}
