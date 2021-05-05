import { toTsMethodName } from './gen-ts-type'
import { CallMeta } from './types'

function hasMethod(instance: any, method: string) {
  return typeof instance[method] === 'function'
}

export function genApplyCall(callMetas: CallMeta[], logicalProcessor: object) {
  let code = `
export function applyCall(call: CallIn, context: Context): CallOut {
  switch (call.id) {`
  const notImplementedCallMetas: CallMeta[] = []
  callMetas.forEach(call => {
    const method = toTsMethodName(call.type)
    if (!hasMethod(logicalProcessor, method)) {
      notImplementedCallMetas.push(call)
      return
    }
    code += `
    case ${call.id}:
      return logicalProcessor.${method}(call.in, context)`
  })
  if (notImplementedCallMetas.length > 0) {
    notImplementedCallMetas.forEach(call => {
      code += `
    case ${call.id}:`
    })
    code += `
      return { error: 'not implemented call type' } as any`
  }
  code += `
    default:
      return { error: 'unknown call type' } as any
  }
}
`
  return code.trim()
}
