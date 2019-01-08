import { r } from 'rethinkdb-ts';
import { RethinkdbCommandbus } from '../lib/cqrs/impl/rethinkdb-commandbus';
import { RethinkdbEventstore } from '../lib/cqrs/impl/rethinkdb-eventstore';
import { SinglestoreCqrsengine } from '../lib/cqrs/impl/singlestore-cqrsengine';
import {
  user_command,
  user_command_type,
  user_event,
  user_event_type,
  user_query,
  user_query_handler,
  user_query_type,
  user_response,
  user_response_type,
  userDomain,
} from '../models/user';

export type e = user_event;
export type et = user_event_type;
export type c = user_command;
export type ct = user_command_type;
export type q = user_query;
export type qt = user_query_type;
export type r = user_response;
export type rt = user_response_type;
// export type ch = command_handler<c, e, ct, et>;
export type qh = typeof user_query_handler;

export const conn = r.connect({ db: 'test' });
export let eventStore = new RethinkdbEventstore<e, et>({
  eventTable: 'events',
  aggregateTable: 'aggregates',
  connection: conn,
});
export let commandBus = new RethinkdbCommandbus<c, ct>({
  commandTable: 'commands',
  connection: conn,
});

export let cqrsEngine = new SinglestoreCqrsengine<e, c, q, r, et, ct, qt, rt, qh>(eventStore, commandBus);

cqrsEngine.addDomain(userDomain);
