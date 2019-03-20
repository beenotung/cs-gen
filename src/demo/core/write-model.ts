import { Handler, Result } from './callback';
import { ICommand, IEvent, INewEvent } from './data-types';

/**
 * @alias CommandHandler
 * @alias WriteModel
 * */
export class WriteModel< /* generic type */
  Command extends ICommand<Command['command'], Command['type']> = any,
  Event extends IEvent<Event['event'], Event['type']> = any,
  /* internal alias */
  NewEvent extends INewEvent<Event> = any> {

  commandHandlers = new Map<Command['type'], Handler<Command, NewEvent[]>>();

  when<C extends Command = any, E extends Event = any>(type: Command['type'], handler: Handler<C, NewEvent[]>): void {
    this.commandHandlers.set(type, handler.bind(this));
  }

  command(command: Command): Result<NewEvent[]> {
    return this.commandHandlers.get(command.type)(command);
  }
}
