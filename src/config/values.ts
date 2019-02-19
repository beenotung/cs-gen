import { Rethinkdb } from '../lib/cqrs/impl/rethinkdb';
import { RethinkdbCqrsEngine } from '../lib/cqrs/impl/rethinkdb-cqrs-engine';
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
  UserDomain,
} from '../models/user';

export type e = user_event;
export type et = user_event_type;
export type c = user_command;
export type ct = user_command_type;
export type q = user_query;
export type qt = user_query_type;
export type r = user_response;
export type rt = user_response_type;
export type qh = user_query_handler;

export let rethinkdb = new Rethinkdb({ db: 'test' });
export let cqrsEngine = new RethinkdbCqrsEngine<e, c, q, r, et, ct, qt, rt, qh>(
  rethinkdb,
);
export let userDomain = new UserDomain(rethinkdb);

export let allDomainReady = Promise.all(
  [userDomain].map(domain => domain.start()),
);
