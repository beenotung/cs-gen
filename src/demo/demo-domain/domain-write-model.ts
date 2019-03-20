import { WriteModel } from '../core/write-model';
import { DomainCommand, RegisterService, RegisterUser } from './domain-command';
import { DomainEvent, ServiceRegistered, UserRegistered } from './domain-event';

export class DomainWriteModel extends WriteModel<DomainCommand, DomainEvent> {
  constructor() {
    super();
    this.when('RegisterUser', this.registerUser);
    this.when('RegisterService', this.registerService);
  }

  registerUser(command: RegisterUser) {
    const e: UserRegistered = {
      type: 'UserRegistered',
      aggregate_id: command.command.user_id,
      seq: 1,
      event: {
        user_id: command.command.user_id,
        nickname: command.command.nickname,
      },
      timestamp: Date.now(),
      from_command_id: command.command_id,
    };
    return [e];
  }

  registerService(command: RegisterService) {
    const e: ServiceRegistered = {
      type: 'ServiceRegistered',
      aggregate_id: command.command.service_id,
      seq: 1,
      event: {
        service_id: command.command.service_id,
        provider_user_id: command.command.user_id,
        service_name: command.command.service_name,
        service_desc: command.command.service_desc,
      },
      timestamp: Date.now(),
      from_command_id: command.command_id,
    };
    return [e];
  }
}
