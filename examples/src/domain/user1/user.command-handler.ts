import { SaveEventResult, INewEvent } from 'cqrs-exp';
import { IWriteModel, ICommand, IEvent } from 'cqrs-exp';
import { UserEvent } from './user.event.type';
import { UserCommand } from './user.command.type';
import { str_filter } from '../../utils/string';
import { base58Letters } from '@beenotung/tslib/random';
import { genId } from '../id/id';
import { Drop } from '@beenotung/tslib';

export class UserCommandHandler implements IWriteModel<UserCommand, UserEvent> {
  async command(command: UserCommand): Promise<UserCommand['result']> {
    switch (command.type) {
      case 'CreateUser': {
        let aggregate_id = [
          str_filter(
            command.command.username,
            c => base58Letters.indexOf(c) !== -1,
          ),
          genId(),
        ].join(':');
        let event: UserEvent = {
          type: 'UserCreated',
          data: {
            user_id: aggregate_id,
            username: command.command.username,
          },
          aggregate_id: aggregate_id,
          version: 1,
          timestamp: Date.now(),
        };
        return { ok: [event] };
      }
      case 'ChangeUsername': {
        let event: INewEvent<UserEvent> = {
          type: 'UsernameChanged',
          data: {
            user_id: command.command.user_id,
            username: command.command.username,
          },
          timestamp: Date.now(),
          aggregate_id: command.command.user_id,
        };
        return { ok: [event] };
      }
    }
  }
}
