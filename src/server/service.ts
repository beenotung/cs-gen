import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ICommand, IEvent, IQuery } from '../core/data';
import { SaveEventResult } from '../core/helper.types';
import { IEventStore, IReadModel, IWriteModel } from '../core/interface';
import { pos_int } from '../core/type';

@Injectable()
export class CqrsService<Command extends ICommand<Command['command'], Command['result'], Event, Command['type']>,
  Event extends IEvent<Event['data'], Event['type']>,
  Query extends IQuery<Query['query'], Query['response'], Query['type']>,
  > implements IReadModel<Event, Query> {
  writeModels = new Map<Command['type'], IWriteModel<Command, Event>>();
  readModels = new Map<Query['type'], IReadModel<Event, Query>>();

  constructor(public eventStore: IEventStore<Event>) {
  }

  attachWriteModel(writeModel: IWriteModel<Command, Event>, commandTypes: Array<Command['type']>) {
    commandTypes.forEach(commandType => this.writeModels.set(commandType, writeModel));
  }

  attachReadModel(readModel: IReadModel<Event, Query>, queryTypes: Array<Query['type']>) {
    queryTypes.forEach(queryType => this.readModels.set(queryType, readModel));
  }

  getWriteModel(type: Command['type']) {
    const writeModel = this.writeModels.get(type);
    if (writeModel) {
      return writeModel;
    }
    throw new HttpException(`unknown command type: '${type}'`, HttpStatus.NOT_IMPLEMENTED);
  }

  getReadModel(type: Query['type']) {
    const readModel = this.readModels.get(type);
    if (readModel) {
      return readModel;
    }
    throw new HttpException(`unknown query type: '${type}'`, HttpStatus.NOT_IMPLEMENTED);
  }

  async command(command: Command): Promise<SaveEventResult<Event>> {
    const result: SaveEventResult<Event> = await this.getWriteModel(command.type).command(command);
    switch (typeof result) {
      case 'string':
      case 'number':
        return result;
      default:
        if (Array.isArray(result)) {
          return result;
        }
        if ('ok' in result && Array.isArray(result.ok)) {
          return this.eventStore.saveEvents(result.ok as any);
        }
        return result;
    }
  }

  query(query: Query): Promise<Query['response']> {
    return this.getReadModel(query.type).query(query);
  }

  querySince(query: Query, sinceTimestamp: pos_int): Promise<Query['response']> {
    return this.getReadModel(query.type).querySince(query, sinceTimestamp);
  }
}
