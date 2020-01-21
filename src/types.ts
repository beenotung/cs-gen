export interface BaseMessageContext {
  app_id: string
  token?: string
}

export interface BaseMessageType extends BaseMessageContext {
  message_type: string
  message_id: string // maybe UUID ?
  create_timestamp: number // when received by event store
  effective_timestamp: number // intended time to take effect
  correlation_id: string // root cause
  causation_id: string // direct cause
  payload?: any
}

export interface CommandType extends BaseMessageType {
  message_type: 'command'
  // command_id :string
  command_type: string // domain specific
}

export interface EventType extends BaseMessageType {
  message_type: 'event'
  // event_id:string
  event_type: string // domain specific
}

export interface QueryType extends BaseMessageType {
  message_type: 'query'
  query_type: string // domain specific
}
