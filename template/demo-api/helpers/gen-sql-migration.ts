import { EOL } from 'os'
import { CallMeta } from './types'
import { BetterSqlite3Helper } from 'better-sqlite3-helper'
import { readdirSync } from 'fs'
import { join } from 'path'
import { inspect } from 'util'
import { saveCode } from './fs'

// use single-quote to wrap the string
function quoteString(str: string): string {
  return inspect(str)
}

function genMigrationCode(callMetas: CallMeta[]): string {
  const ups: string[] = []
  const downs: string[] = []

  callMetas.forEach(call => {
    ups.push('')

    if (call.in) {
      const table = call.type
      const cols: string[] = []
      cols.push(`${EOL}    log_id integer unique references log(id)`)
      Object.entries(call.in).forEach(([name, type]) => {
        if (Array.isArray(type)) {
          type = type[0]
        }
        let nullable = 'not null'
        if (name.endsWith('?')) {
          name = name.substring(0, name.length - 1)
          nullable = 'null'
        }
        if (type === 'text') {
          cols.push(`${EOL}    ${name} integer ${nullable} references str(id)`)
        } else {
          cols.push(`${EOL}    ${name} ${type} ${nullable}`)
        }
      })
      const body = cols.join(',') + EOL
      ups.push(`create table if not exists ${table} (${body});`)
      downs.push(`drop table if exists ${table};`)
    }

    const id = call.id
    const call_type = quoteString(call.call_type)
    const type = quoteString(call.type)
    const replay = call.replay ? 1 : 0
    ups.push(
      `insert into log_meta (id, call_type, type, replay) values (${id}, ${call_type}, ${type}, ${replay});`,
    )
    downs.push(`delete from log_meta where id = ${id} and type = ${type};`)

    downs.push('')
  })

  const lines: string[] = []
  lines.push('-- Up')
  lines.push(...ups)
  lines.push('')
  lines.push('-- Down')
  lines.push(...downs.reverse())

  return lines.join(EOL)
}

function filterNewCallMetas(
  callMetas: CallMeta[],
  db: BetterSqlite3Helper.DBInstance,
): CallMeta[] {
  const existingCallMetas: CallMeta[] = db
    .prepare(`select id, type from log_meta`)
    .all()
  return callMetas.filter(
    call =>
      !existingCallMetas.some(
        existing => call.id == existing.id && call.type == existing.type,
      ),
  )
}

export function genNextMigrationFilename(migrationsPath: string): string {
  const lastFilename = readdirSync(migrationsPath).sort().pop()
  if (!lastFilename) {
    console.error(
      'gen-sql-migration.ts: genNextMigrationFilename(): no existing migration files. Missing 001-create-log-meta.sql ?',
    )
    throw new Error('no existing migration files')
  }
  const lastId = parseInt(lastFilename)
  if (!lastId) {
    console.error(
      'gen-sql-migration.ts: genNextMigrationFilename(): failed to parse id of last migration file.',
      { lastFilename },
    )
    throw new Error('failed to parse id of last migration file')
  }
  let filename = (lastId + 1).toString()
  while (filename.length < 3) {
    filename = '0' + filename
  }
  filename += `-create-log-tables.sql`
  return join(migrationsPath, filename)
}

export function genMigrationFile(
  callMetas: CallMeta[],
  db: BetterSqlite3Helper.DBInstance,
  filename: string,
): void {
  callMetas = filterNewCallMetas(callMetas, db)
  console.debug('number of new log type to migrate:', callMetas.length)
  if (callMetas.length === 0) {
    return
  }
  saveCode(genMigrationCode(callMetas), filename)
}
