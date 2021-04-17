export type CallMeta = {
  id: number // unique
  call_type: 'command' | 'query' | 'subscribe'
  type: string
  in?: ObjectType
  out?: ObjectType
  errors?: string[] // error message failed
  feed?: ObjectType // default is not food
  replay: boolean
  async?: boolean // default is sync
}

export type ObjectType = Record<string, FieldType>

export type FieldType = sql_type | [sql_type, ts_type]

export type ts_type = Reasons | string

export type Reasons = string[]

export type sql_type = 'integer' | 'real' | 'text' | 'blob'

export const sql_to_ts = {
  integer: 'number',
  real: 'number',
  text: 'string',
  blob: 'Buffer',
}
