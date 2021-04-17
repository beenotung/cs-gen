export type ObjectType = [name, ObjectField[]]
export type ObjectField = [name, sql_type, ts_type?]

type name = string
type sql_type = string
type ts_type = string

export function genTsType([name, fields]: ObjectType): string {
  const body = fields.map(genTsField).join('')
  return `export type ${name} = {${body}}`
}

export function genCreateTableSql([name, fields]: ObjectType): string {
  const body = fields.map(genCreateTableColumn).join(',')
  return `create table if not exists ${name}(${body});`
}

function genCreateTableColumn([name, type]: ObjectField): string {
  return `\n  ${name} ${type}`
}

function genTsField([name, sql_type, ts_type]: ObjectField): string {
  ts_type = ts_type || sqlTypeToTsType(sql_type)
  return `\n  ${name}: ${ts_type}`
}

function sqlTypeToTsType(sql_type: string): string {
  sql_type = sql_type
    .toLowerCase()
    .replace(/ references .*$/, '')
    .replace(/ unique$/, '')
    .replace(/ primary key$/, '')
    .replace(/ not null$/, '')
  if (sql_type.endsWith(' null')) {
    return getTsType(sql_type.replace(/ null$/, '')) + ' | null | undefined'
  }
  return getTsType(sql_type)
}

function getTsType(sql_type: string) {
  return sql_to_ts_types[sql_type] || 'any'
}

const sql_to_ts_types: Record<string, string> = {
  integer: 'number',
  real: 'number',
  text: 'string',
  blob: 'Buffer',
  json: 'any',
}

export function fromSqlData(sql_type: string, value: any) {
  if (sql_type === 'json') {
    return JSON.parse(value)
  }
  return value
}
