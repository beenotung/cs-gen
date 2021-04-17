import { writeFileSync } from 'fs'
import { EOL } from 'os'
import { CallMeta, SqlType, toTsFieldType } from './types'
import { toTsTypeName } from './gen-ts-type'
import { partitionArrayBy } from '@beenotung/tslib'

// using Intellij Idea format
export function genInsertFileContent(callMetas: CallMeta[]): string {
  const [emptyCalls, nonEmptyCalls] = partitionArrayBy(
    callMetas,
    call => !call.in,
  )

  const lines: string[] = []
  lines.push(`import { getStrId, getJsonId, insertLog } from './db-queries'`)
  lines.push(`import type { IntLike } from 'integer'`)

  // import log types
  lines.push(`import type {`)
  lines.push(`  CallIn,`)
  nonEmptyCalls.forEach(call => lines.push(`  ${toTsTypeName(call.type)},`))
  lines.push(`} from './types'`)

  // insert log functions
  nonEmptyCalls.forEach(call => {
    const colNames: string[] = []
    colNames.push('log_id')
    if (call.in) {
      Object.keys(call.in).forEach(name =>
        colNames.push(name.replace(/\?$/, '')),
      )
    }

    const table = call.type

    // prepared statement
    {
      const cols = colNames.map(name => ` ${name}`).join(`${EOL}  ,`)
      const vals = colNames.map(name => ` :${name}`).join(`${EOL}         ,`)
      lines.push('')
      lines.push(
        `const insert_${table} = db.prepare(\`
  insert into ${table}
  (${cols})
  values (${vals});\`)`,
      )
    }

    // insert function
    {
      const name = toTsTypeName(table)
      lines.push(`
export function insert${name}(
  log_id: IntLike,
  callIn: ${name}['in'],
) {
  return insert_${table}.run({
    log_id,`)
      if (call.in) {
        Object.entries(call.in).forEach(([name, type]) => {
          name = name.replace(/\?$/, '')
          const field = `callIn.${name}`
          const sqlType: SqlType = Array.isArray(type) ? type[0] : type
          const tsType = toTsFieldType(type)
          let value: string
          if (tsType === 'boolean') {
            value = `${field} === null || ${field} === undefined ? null : ${field} ? 1 : 0`
          } else if (sqlType === 'text') {
            if (tsType === 'string') {
              value = `getStrId(${field})`
            } else {
              value = `getJsonId(${field})`
            }
          } else {
            value = field
          }
          lines.push(`    ${name}: ${value},`)
        })
      }
      lines.push(`  })`)
      lines.push(`}`)
    }
  })

  // storeLog function
  lines.push('')
  lines.push(
    `export function storeLog(timestamp: number, acc: number, call: CallIn) {`,
  )
  lines.push(`  const log_id = insertLog(timestamp, acc, call.id)`)
  lines.push(`  switch (call.id) {`)
  nonEmptyCalls.forEach(call => {
    lines.push(`    case ${call.id}:`)
    const name = toTsTypeName(call.type)
    lines.push(`      insert${name}(log_id, call.in)`)
    lines.push(`      break`)
  })
  if (emptyCalls.length > 0) {
    emptyCalls.forEach(call => {
      lines.push(`    case ${call.id}:`)
    })
    lines.push(`      // skip insert body for empty input`)
    lines.push(`      break`)
  }
  lines.push(`    default:`)
  lines.push(`      throw new Error('unknown meta_id: ' + (call as any).id)`)
  lines.push(`  }`)
  lines.push(`}`)

  return lines.join(EOL)
}

export function genInsertFile(
  callMetas: CallMeta[],
  file: string,
  dbExpr: string, // new DB or import db
): void {
  const content = dbExpr + EOL + genInsertFileContent(callMetas) + EOL
  writeFileSync(file, content)
}
