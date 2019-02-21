import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ICqrsWriteServer, IEventStore, IWriteModel } from '../core/cqrs.types';
import { ICommand, ICommandWithEvents, IEvent } from '../core/data';
import { ID } from '../core/type';

@Injectable()
export class CommandRouterService<Model extends IWriteModel<Command, CommandWithEvents, Event>,
  Command extends ICommand<any, any, any>,
  CommandWithEvents extends ICommandWithEvents<any, any, any, any, any>,
  Event extends IEvent<Event['data'], Event['type']>,
  >
  implements ICqrsWriteServer<Command, CommandWithEvents, Event> {
  /**@deprecated*/
  eventStore: IEventStore = null;

  constructor(
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

  handleCommand(command: Command): Promise<Command> {
    return this.getModelByCommandType(command.type).handleCommand(command);
  }

  handleCommandAndGetEvents(command: CommandWithEvents): Promise<CommandWithEvents> {
    return this.getModelByCommandType(command.type).handleCommandAndGetEvents(command);
  }

}
