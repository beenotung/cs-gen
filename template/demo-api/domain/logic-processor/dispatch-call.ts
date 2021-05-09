import { Context } from './engine-helpers'
import { Call, CallIn, CallOut } from '../types'
import { ILogicalProcessor } from './logic-processor-interface'
import { toTsMethodName } from '../../macro-helpers/gen-ts-type'
import { callMetas } from '../../config/call-meta'

const methodNameById = {} as Record<Call['id'], keyof ILogicalProcessor>

callMetas.forEach(call => {
  const id = call.id as Call['id']
  methodNameById[id] = toTsMethodName(call.type) as keyof ILogicalProcessor
})

export function dispatchCall(
  logicalProcessor: Partial<ILogicalProcessor>,
  call: CallIn,
  context: Context,
): CallOut {
  const method = methodNameById[call.id]
  if (!method) {
    console.error('unknown call type:', { id: call.id })
    return { error: 'unknown call type' as any }
  }
  if (!logicalProcessor[method]) {
    return { error: 'not implemented call type' as any }
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return logicalProcessor[method]!(call.in as any, context)
}
