import { ReadModel } from './read-model';
import { WriteModel } from './write-model';
import { ICommand, IEvent, INewEvent, IQuery } from './data-types';
import { EventStore } from './event-store';
import { Result, then } from './callback';
import {
  CommandHandlingFailed,
  CqrsDomainEvent,
  UnknownCommandReceived,
  UnknownQueryReceived,
} from '../cqrs-domain/cqrs-domain-event';
import { CommandResult, InternalCommandResult } from '../cqrs-domain/cqrs-command-result';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DomainEvent } from '../demo-domain/domain-event';

export type ICqrsServer = { command: WriteModel['command'] } & { query: ReadModel['query'] };

export class CqrsServer<Command extends ICommand<Command['command'], Command['type']> = ICommand,
  Event extends IEvent<Event['event'], Event['type']> = IEvent,
  Query extends IQuery<Query['query'], Query['response'], Query['type']> = IQuery>
  implements ICqrsServer {
  writeModels: WriteModel[] = [];
  readModels: ReadModel[] = [];

  constructor(public eventStore: EventStore<Event['type']>) {
  }

  registerReadModel(readModel: ReadModel) {
    this.readModels.push(readModel);
  }

  registerWriteModel(writeModel: WriteModel) {
    this.writeModels.push(writeModel);
  }

  command<C extends Command = any>(command: C | any): Result<Event[]> {
    let returnError = (event: INewEvent<CqrsDomainEvent>, response: string | object, status: number): any => {
      return then(() => this.eventStore.saveEvents([event]), () => {
        throw new HttpException(response, status);
      });
    };

    let writeModel = this.writeModels.find(x => x.commandHandlers.has(command.type));
    if (!writeModel) {
      let e: INewEvent<UnknownCommandReceived> = {
        type: 'UnknownCommandReceived',
        aggregate_id: 'cqrs-server',
        event: command,
        from_command_id: command.command_id,
        timestamp: Date.now(),
      };
      return returnError(e, e.type, HttpStatus.NOT_ACCEPTABLE);
    }

    return then(() => writeModel.command(command), (newEvents: INewEvent<Event>[]): Result<Event[]> => {
      if (!Array.isArray(newEvents)) {
        console.error('wrong implementation, expected to get array of event when handling command of type:', command.type, 'but got:', newEvents);
        let message = 'wrong implementation, expected to get array of event when handling command of type: ' + command.type;
        let e: INewEvent<CommandHandlingFailed> = {
          type: 'CommandHandlingFailed',
          aggregate_id: 'cqrs-server',
          event: { command, error_message: message },
          from_command_id: command.command_id,
          timestamp: Date.now(),
        };
        return returnError(e, e.type, HttpStatus.NOT_ACCEPTABLE);
      }

      return this.eventStore.saveEvents(newEvents);
    });
  }

  query<Q extends Query = any>(query: Q | any): Q['response'] {
    let readModel = this.readModels.find(x => x.queryHandlers.has(query.type));
    if (!readModel) {
      const e: INewEvent<UnknownQueryReceived> = {
        type: 'UnknownQueryReceived',
        aggregate_id: 'cqrs-server',
        event: query,
        from_command_id: null,
        timestamp: Date.now(),
      };
      return then(() => this.eventStore.saveEvents([e]), () => {
        throw new HttpException('UnknownQueryReceived', HttpStatus.NOT_ACCEPTABLE);
      }) as any;
    }
    return readModel.query(query);
  }
}
