import { Context } from './engine-helpers'
import { CallIn, CallOut, Call } from './types'
import { ILogicalProcessor } from './logic-processor-interface'
import { toTsMethodName } from '../helpers/gen-ts-type'
import { callMetas } from '../config/call-meta'

const methodsById = {} as Record<Call['id'], keyof ILogicalProcessor>

callMetas.forEach(call => {
  const id = call.id as Call['id']
  const method = toTsMethodName(call.type) as keyof ILogicalProcessor
  methodsById[id] = method
})

export function applyCall(
  logicalProcessor: Partial<ILogicalProcessor>,
  call: CallIn,
  context: Context,
): CallOut {
  const method = methodsById[call.id]
  if (!method) {
    console.error('unknown call type:', { id: call.id })
    return { error: 'unknown call type' } as any
  }
  if (!logicalProcessor[method]) {
    return { error: 'not implemented call type' } as any
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return logicalProcessor[method]!(call.in as any, context)
}
