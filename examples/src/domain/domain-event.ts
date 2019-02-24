import 'cqrs-exp';
import { ensureEventType, timestamp, pos_int } from 'cqrs-exp';
import { CommonEvent } from './common-event';

export type UserCreated = {
  type: 'UserCreated';
  data: {
    user_id: string;
    nickname: string;
  };
} & CommonEvent;

export type ServiceRegistered = {
  type: 'ServiceRegistered';
  data: {
    service_id: string;
    service_provider_user_id: string;
    service_name: string;
    service_description: string;
  };
} & CommonEvent;

export type BookingPlaced = {
  type: 'BookingPlaced';
  data: {
    booking_id: string;
    service_id: string;
    service_consumer_user_id: string;
    suggested_service_start_time: string;
    suggested_service_finish_time: string;
  };
} & CommonEvent;

export type BookingConfirmed = {
  type: 'BookingAccepted' | 'BookingRejected';
  data: {
    booking_id: string;
  };
} & CommonEvent;

export type DomainEvent =
  | UserCreated
  | ServiceRegistered
  | BookingPlaced
  | BookingConfirmed;

ensureEventType<DomainEvent>();
