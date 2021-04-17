import { CallMeta, ObjectType, toTsFieldType } from './types'
import { EOL } from 'os'
import { inspect } from 'util'
import { capitalize } from '@beenotung/tslib/string'
import { binArrayBy } from '@beenotung/tslib/array'

export function genTsTypes(callMetas: CallMeta[]): string {
  const lines: string[] = []

  // each log types
  callMetas.forEach(call => {
    const name = toTsTypeName(call.type)
    lines.push(`export type ${name} = {
  id: ${call.id}
  call_type: ${quoteString(call.call_type)}
  type: ${quoteString(call.type)}
  in: ${toTsObjectType(call.in)}
  out: ${toTsObjectType(call.out)}
  feed: ${toTsObjectType(call.feed)}
  errors: ${inspect(call.errors || [])}
}`)
    lines.push('')
  })

  // group by call types
  const callsByType = binArrayBy(callMetas, call => call.call_type)
  callsByType.forEach((calls, callType) => {
    const name = toTsTypeName(callType)
    const body = calls
      .map(call => toTsTypeName(call.type))
      .map(name => `${EOL}  | ${name}`)
      .join('')
    lines.push(`export type ${name} = ${body}`)
    lines.push('')
  })

  // aggregated type
  const callTypes = Array.from(callsByType.keys()).map(toTsTypeName).join(` | `)
  lines.push(`export type Call = ${callTypes}`)
  lines.push('')

  // helper types
  const callInTypes = callMetas
    .map(call => toTsTypeName(call.type))
    .map(name => `${EOL}  | Pick<${name}, 'id' | 'in'>`)
    .join('')
  lines.push(`export type CallIn = ${callInTypes}`)

  return lines.join(EOL)
}

function toTsTypeName(name: string): string {
  return name.split('_').map(capitalize).join('')
}

function toTsObjectType(type: ObjectType | undefined): string {
  if (!type) {
    return 'void | null | {}'
  }
  const cols: string[] = []
  Object.entries(type).forEach(([name, type]) => {
    let tsType = toTsFieldType(type)
    tsType = indentCustomTsFieldType(tsType)
    cols.push(`${EOL}    ${name}: ${tsType}`)
  })
  const body = cols.join('') + EOL
  return `{${body}  }`
}

function indentCustomTsFieldType(type: string) {
  const lines = type.split(EOL)
  const newLines = lines.map(line => '    ' + line)
  newLines[0] = lines[0]
  return newLines.join(EOL)
}

function quoteString(str: string): string {
  return inspect(str)
}
