import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ICqrsReadServer, IEventStore, IReadModel } from '../core/cqrs.types';
import { IQuery } from '../core/data';
import { ID, pos_int } from '../core/type';

@Injectable()
export class QueryRouterService<Model extends IReadModel<any, any, any, any, any, any, any, any, any>,
  Query extends IQuery<any, any, any>>
  implements ICqrsReadServer<any, any, any, any> {
  /**@deprecated*/
  eventStore: IEventStore;

  constructor(
    public models: Model[],
  ) {
  }

  getModelByQueryType(type: ID): Model {
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
