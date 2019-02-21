import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ICqrsWriteServer, IEventStore, IWriteModel } from '../core/cqrs.types';
import { ICommand, ICommandWithEvents } from '../core/data';
import { ID, JsonValue } from '../core/type';

@Injectable()
export class CommandRouterService<Model extends IWriteModel<any>> implements ICqrsWriteServer {
  constructor(
    public eventStore: IEventStore,
    public models: Model[],
  ) {
  }

  getModelByCommandType(type: ID): Model {
    const model = this.models.find(model => model.commandTypes.indexOf(type) !== -1);
    if (!model) {
      throw new HttpException('write model not found for command type:' + type, HttpStatus.NOT_IMPLEMENTED);
    }
    return model;
  }

  handleCommand<Command extends ICommand<C, R, CT>, C extends JsonValue, R extends JsonValue, CT extends ID>
  (command: Command): Promise<Command> {
    return this.getModelByCommandType(command.type).handleCommand(command);
  }

  handleCommandAndGetEvents<Command extends ICommandWithEvents<C, R, E, CT, ET>,
    C extends JsonValue, R extends JsonValue, E extends JsonValue, CT extends ID, ET extends ID>
  (command: Command): Promise<Command> {
    return this.getModelByCommandType(command.type).handleCommandAndGetEvents(command);
  }

}
