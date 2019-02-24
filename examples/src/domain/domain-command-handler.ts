import { DomainCommand } from './domain-command';
import { DomainEvent } from './domain-event';
import { CommonCommandResult } from 'cqrs-exp';
import { hashObject } from '../utils/hash';

export function handleDomainCommand(
  command: DomainCommand,
): CommonCommandResult | DomainEvent[] {
  switch (command.type) {
    case 'CreateUser': {
      let aggregate_id = hashObject(command);
      return [
        {
          type: 'UserCreated',
          aggregate_id,
        },
      ];
      break;
    }
    case 'RegisterService':
    case 'PlaceBooking':
    case 'AcceptBooking':
    case 'RejectBooking':
  }
  return 501;
}
