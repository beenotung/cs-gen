import { Context } from './engine-helpers'
import { logicalProcessor } from './instances'
import { CallIn, CallOut } from './types'

export function applyCall(call: CallIn, context: Context): CallOut {
  switch (call.id) {
    case 1:
      return logicalProcessor.createUser(call.in, context)
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      return { error: 'not implemented call type' } as any
    default:
      return { error: 'unknown call type' } as any
  }
}
