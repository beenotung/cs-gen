import { callMetas } from '../../config/call-meta'
import { toTsTypeName } from '../../helpers/gen-ts-type'
import { FieldType, toSqlType, toTsFieldType } from '../../helpers/types'
import { formatCode } from '../../helpers/format'

function toTsValueCode(type: FieldType, field: string): string {
  const tsType = toTsFieldType(type)
  if (tsType === 'boolean') {
    return `
  ${field} = ${field} === null || ${field} === undefined ? null : !!${field}`
  }
  const sqlType = toSqlType(type)
  if (sqlType !== 'text') {
    return ''
  }
  if (tsType === 'string') {
    return `
  ${field} = getStrVal(${field})`
  }
  return `
  ${field} = getJsonVal(${field})`
}

let code = `
import { db } from '../../config/db'
import { getStrVal, getJsonVal } from './str-helpers'
import type { IntLike } from 'integer'
import type * as t from '../types'
`
callMetas.forEach(call => {
  if (!call.in) {
    return
  }
  const { type } = call
  const Type = toTsTypeName(type)
  const input = call.in

  // prepared statement
  code += `
const select_${type} = db.prepare(\`
  select *
  from ${type}
  where log_id = ?
  limit 1
\`)
`

  // select function
  code += `
export function select${Type}(log_id: IntLike): t.${Type}['in'] {
  const row = select_${type}.get(log_id)`
  Object.entries(input).forEach(([name, type]) => {
    name = name.replace(/\?$/, '')
    code += toTsValueCode(type, `row.${name}`)
  })
  code += `
  return row
}
`
})

formatCode(code)
