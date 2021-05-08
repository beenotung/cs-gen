import { callMetas } from '../config/call-meta'
import { EOL } from 'os'
import { toTsTypeName } from '../helpers/gen-ts-type'
import { FieldType, toSqlType, toTsFieldType } from '../helpers/types'

function toSqlValueCode(type: FieldType, field: string) {
  const sqlType = toSqlType(type)
  const tsType = toTsFieldType(type)
  if (tsType === 'boolean') {
    return `${field} === null || ${field} === undefined ? null : ${field} ? 1 : 0`
  }
  if (sqlType === 'text') {
    if (tsType === 'string') {
      return `getStrId(${field})`
    }
    return `getJsonId(${field})`
  }
  return field
}

let code = `
import { db } from '../config/db'
import { getStrId, getJsonId } from './db-queries'
import type { IntLike } from 'integer'
import type * as t from './types'
`
callMetas.forEach(call => {
  if (!call.in) {
    return
  }
  const { type } = call
  const Type = toTsTypeName(type)
  const input = call.in || {}

  const cols = Object.keys(input).map(name => name.replace(/\?$/, ''))

  // prepared statement
  code += `
const insert_${type} = db.prepare(\`
  insert into ${type}
  ( log_id`
  cols.forEach(
    col =>
      (code += `
  , ${col}`),
  )
  code += `)
  values ( :log_id`
  cols.forEach(
    col =>
      code +
      `
         , :${col}`,
  )
  cols.forEach(
    col =>
      (code += `
         , :${col}`),
  )
  code += `);\`)
`

  // insert function
  code += `
export function insert${Type}(log_id: IntLike, callIn: t.${Type}['in']) {
  return insert_${type}.run({
    log_id,`
  Object.entries(input).forEach(([name, type]) => {
    name = name.replace(/\?$/, '')
    const value = toSqlValueCode(type, `callIn.${name}`)
    code += `
    ${name}: ${value},`
  })
  code += `
  })
}
`
})

code.trim() + EOL
