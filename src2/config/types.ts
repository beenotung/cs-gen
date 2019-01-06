import { UserCommandType } from '../models/user/user.command.type';
import { UserEventType } from '../models/user/user.event.type';
import { UserQueryResultType, UserQueryType } from '../models/user/user.model';
import { UserQueryInputType } from '../models/user/user.query.type';

/* CQRS Command */
export type CommandType = UserCommandType;

/* CQRS Event */
export type EventType = UserEventType;

/* CQRS Query */
export type QueryInputType = UserQueryInputType;
export type QueryResultType = UserQueryResultType;
export type QueryType = UserQueryType;
