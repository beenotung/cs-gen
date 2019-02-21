import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ICqrsReadServer, IEventStore, IReadModel } from '../core/cqrs.types';
import { IEvent, IQuery } from '../core/data';
import { pos_int } from '../core/type';

@Injectable()
export class QueryRouterService<Model extends IReadModel<any, Event, Query, any>,
  Event extends IEvent<Event['data'], Event['type']>,
  Query extends IQuery<Query['query'], Query['response'], Query['type']>
  > implements ICqrsReadServer<Query> {

  /**@deprecated*/
  eventStore: IEventStore;

  constructor(
    public models: Model[],
  ) {
  }

  getModelByQueryType(type: Query['type']): Model {
    const model = this.models.find(model => model.queryTypes.indexOf(type) !== -1);
    if (!model) {
      throw new HttpException('read model not found for query type:' + type, HttpStatus.NOT_IMPLEMENTED);
    }
    return model;
  }

  handleQuery(query: Query): Promise<Query> {
    return this.getModelByQueryType(query.type).handleQuery(query);
  }

  handleQuerySince(query: Query, sinceTimestamp: pos_int): Promise<Query> {
    return this.getModelByQueryType(query.type).handleQuerySince(query, sinceTimestamp);
  }
}
