import { toTsLiteral, toTsTypeName, unionTypes } from '../helpers/gen-ts-type'
import { callMetas } from '../config/call-meta'
import { ObjectType, toTsFieldType } from '../helpers/types'
import { EOL } from 'os'
import { binArrayBy } from '@beenotung/tslib/array'
import { formatCode } from '../helpers/format'

function objectType(type: ObjectType | undefined) {
  if (!type) {
    return 'void'
  }
  let code = `{`
  Object.entries(type).forEach(([name, type]) => {
    const tsType = toTsFieldType(type)
      .split(EOL)
      .map(s => '    ' + s)
      .join(EOL)
      .replace('    ', '')
    code += `
    ${name}: ${tsType}`
  })
  code += `
  }`
  return code
}

let code = ``

// each log types
callMetas.forEach(call => {
  const Type = toTsTypeName(call.type)
  const errorType = !call.errors ? 'never' : unionTypes(call.errors, toTsLiteral, '  ')
  code += `
export type ${Type} = {
  id: ${call.id}
  call_type: ${toTsLiteral(call.call_type)}
  type: ${toTsLiteral(call.type)}
  in: ${objectType(call.in)}
  out: ${objectType(call.out)}
  feed: ${objectType(call.feed)}
  error: ${errorType}
}
`
})

// group by call types
const callsByCallType = binArrayBy(callMetas, call => call.call_type)
callsByCallType.forEach((calls, callType) => {
  code += `
export type ${toTsTypeName(callType)} = ${unionTypes(calls, call => toTsTypeName(call.type))}
`
})

// aggregated type and helper types
const types = callMetas.map(call => toTsTypeName(call.type))
code += `
export type Call = ${unionTypes(callsByCallType.keys(), toTsTypeName)}

export type CallIn = ${unionTypes(types, type => `Pick<${type}, 'id' | 'in'>`)}

export type CallOut = ${unionTypes(types, type => `Result<${type}>`)}

export type Result<T extends Call> =
  | { error: T['error'] }
  | { out: T['out'], error?: void }

export const ok = \{ out: void 0 }

export const ids = \{`
callMetas.forEach(({ id, type }) => {
  code += `
  ${type}: ${id} as const,`
})
code += `
}`

formatCode(code)
