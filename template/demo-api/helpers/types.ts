export type CallMeta = {
  id: number // should be unique
  call_type: 'command' | 'query' | 'subscribe'
  type: string
  replay: boolean
  in?: ObjectType
  out?: ObjectType
  errors?: string[]
  feed?: ObjectType // default is not feed
  async?: boolean // default is sync
}

export type ObjectType = Record<string, FieldType>

export type FieldType = SqlType | [SqlType, TsType]

export type TsType = 'number' | 'string' | 'Buffer' | 'any' | string

export type SqlType = 'integer' | 'real' | 'text' | 'blob'

const sqlTypeToTsType: Record<SqlType, TsType> = {
  integer: 'number',
  real: 'number',
  text: 'string',
  blob: 'Buffer',
}

export function toTsFieldType(type: FieldType): TsType {
  if (Array.isArray(type)) {
    return type[1]
  }
  return sqlTypeToTsType[type] || 'any'
}
