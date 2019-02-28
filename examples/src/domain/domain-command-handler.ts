import { DomainCommand } from './domain-command';
import { DomainEvent } from './domain-event';
import { CommonCommandResult } from 'cqrs-exp';
import { hashObject } from '../utils/hash';

export function handleDomainCommand(
  command: DomainCommand,
): CommonCommandResult | DomainEvent[] {
  switch (command.type) {
    case 'CreateUser': {
      let user_id = hashObject(command);
      return [
        {
          type: 'UserCreated',
          aggregate_id: user_id,
          data: {
            user_id: user_id,
            nickname: command.command.nickname,
          },
          timestamp: Date.now(),
          version: 1,
        },
      ];
    }
    case 'RegisterService': {
      let service_id=hashObject(command);
      return [{
        type:'ServiceRegistered',
        aggregate_id:command.command.ser
      }];
    }
    case 'PlaceBooking':
    case 'AcceptBooking':
    case 'RejectBooking':
  }
  return 501;
}
