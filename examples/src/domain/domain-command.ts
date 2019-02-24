import 'cqrs-exp';
import { ensureCommandType, CommonCommandResult, pos_int } from 'cqrs-exp';
import {
  BookingConfirmed,
  BookingPlaced,
  DomainEvent,
  ServiceRegistered,
  UserCreated,
} from './domain-event';

export type DomainCommand = (
  | {
      type: 'CreateUser';
      command: { nickname: string };
      events: [UserCreated];
    }
  | {
      type: 'RegisterService';
      command: {
        service_provider_user_id: string;
        service_name: string;
        service_description: string;
      };
      events: [ServiceRegistered];
    }
  | {
      type: 'PlaceBooking';
      command: {
        service_id: string;
        service_consumer_user_id: string;
        suggested_service_start_time: string;
        suggested_service_finish_time: string;
      };
      events: [BookingPlaced];
    }
  | {
      type: 'AcceptBooking' | 'RejectBooking';
      command: { booking_id: string };
      events: [BookingConfirmed];
    }) & {
  result: CommonCommandResult;
  timestamp: pos_int;
};
ensureCommandType<DomainCommand, DomainEvent>();
