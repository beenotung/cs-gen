import { EOL } from 'os'
import {CallMeta} from "./types";

export function genNewLogTablesMigration(callMetas:CallMeta[]) {
  let lines: string[] = []
  lines.push('-- Up')
  callMetas.forEach(call => {
    let cols: string[] = []
    cols.push(`${EOL}  log_id integer not null unique references log(id)`)
    if (call.in) {
      Object.entries(call.in).forEach(([name, type]) => {
        let line = `${EOL}  `
        if (Array.isArray(type)) {
          // line += `-- ts type: ${type[1]}`
          // line += `${EOL}  `
          type = type[0]
        }
        if (type === 'text') {
          line += `${name} integer not null references str(id)`
        } else {
          line += `${name} ${type} not null`
        }
        cols.push(line)
      })
    }
    let body = cols.join(',') + EOL
    lines.push(`create table if not exists ${call.type} (${body});`)
    lines.push(
      genInsertSql('log_meta', {
        id: call.id,
        call_type: call.call_type,
        type: call.type,
        replay: call.replay ? 1 : 0,
      }),
    )
    lines.push('')
  })
  lines.push('')
  lines.push('-- Down')
  callMetas.forEach(call => {
    lines.push(`drop table if exists ${call.type};`)
  })
  return lines.join(EOL) + EOL
}

function genInsertSql(table: string, row: Record<string, string | number>) {
  let cols: string[] = []
  let vals: string[] = []
  Object.entries(row).forEach(([col, val]) => {
    cols.push(col)
    vals.push(JSON.stringify(val))
  })
  return `insert into ${table} (${cols}) values (${vals});`
}
