import { nextId } from './id';
import { EventType } from './types';

export interface CreateMessageOptions {
  message_id?: string
  causation_id?: string
  correlation_id?: string
  create_timestamp?: number
  effective_timestamp?: number
}

function createMessage(
  {
    message_id,
    causation_id,
    correlation_id,
    create_timestamp,
    effective_timestamp,
  }: CreateMessageOptions) {
  create_timestamp = create_timestamp || Date.now();
  message_id = message_id || nextId();
  return {
    message_id: message_id,
    causation_id: causation_id || message_id,
    correlation_id: correlation_id || message_id,
    create_timestamp: create_timestamp,
    effective_timestamp: effective_timestamp || create_timestamp,
  };
}

export interface CreateEventOptions extends CreateMessageOptions {
  message_id?: string
  event_type: string
  payload?: any
}

let app_id: string | undefined;

export function set_app_id(_app_id: string) {
  app_id = _app_id;
}

export function createEvent(options: CreateEventOptions): EventType {
  if (!app_id) {
    throw new Error('app_id is not set');
  }
  return {
    app_id,
    ...options,
    ...createMessage(options),
    message_type: 'event',
  };
}
