import { CallMeta, ObjectType, toTsFieldType } from './types'
import { EOL } from 'os'
import { inspect } from 'util'
import { binArrayBy } from '@beenotung/tslib/array'
import { ucfirst, lcfirst } from '@beenotung/tslib/string'

export function genTsType(callMetas: CallMeta[]): string {
  const lines: string[] = []

  // each log types
  callMetas.forEach(call => {
    const name = toTsTypeName(call.type)
    const errorType = !call.errors
      ? 'never'
      : call.errors.map(s => inspect(s)).join(' | ')
    lines.push(`export type ${name} = {
  id: ${call.id}
  call_type: ${quoteString(call.call_type)}
  type: ${quoteString(call.type)}
  in: ${toTsObjectType(call.in)}
  out: ${toTsObjectType(call.out)}
  feed: ${toTsObjectType(call.feed)}
  error: ${errorType}
}`)
    lines.push('')
  })

  // group by call types
  const callsByType = binArrayBy(callMetas, call => call.call_type)
  callsByType.forEach((calls, callType) => {
    defUnionType(
      lines,
      toTsTypeName(callType),
      calls.map(call => toTsTypeName(call.type)),
    )
    lines.push('')
  })

  // aggregated type
  const callTypes = Array.from(callsByType.keys()).map(toTsTypeName).join(` | `)
  lines.push(`export type Call = ${callTypes}`)
  lines.push('')

  // helper types
  const callTypeNames = callMetas.map(call => toTsTypeName(call.type))

  // CallIn
  defUnionType(
    lines,
    'CallIn',
    callTypeNames.map(type => `Pick<${type}, 'id' | 'in'>`),
  )
  lines.push('')

  // CallOut
  lines.push(
    `
export type Result<T extends Call> =
  | { error: T['error'] }
  | { error?: undefined, out: T['out'] }
`.trim(),
  )
  lines.push('')
  defUnionType(
    lines,
    'CallOut',
    callTypeNames.map(type => `Result<${type}>`),
  )
  lines.push('')

  // ids
  lines.push(`export const ids = {`)
  callMetas.forEach(({ id, type }) => lines.push(`  ${type}: ${id} as const,`))
  lines.push(`}`)
  lines.push('')

  // Successful value of command
  lines.push('export const ok = { out: void 0 }')
  lines.push('')

  return lines.join(EOL)
}

export function toTsTypeName(name: string): string {
  return name.split('_').map(ucfirst).join('')
}

export function toTsMethodName(name: string): string {
  name = toTsTypeName(name)
  return lcfirst(name)
}

function toTsObjectType(type: ObjectType | undefined): string {
  if (!type) {
    return 'void'
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

function defUnionType(lines: string[], name: string, types: string[]) {
  lines.push(`export type ${name} =`)
  types.forEach(type => lines.push(`  | ${type}`))
}
