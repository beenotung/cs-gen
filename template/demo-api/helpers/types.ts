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

export type TsType = string

export type SqlType = 'integer' | 'real' | 'text' | 'blob'
