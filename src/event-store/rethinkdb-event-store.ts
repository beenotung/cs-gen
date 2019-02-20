import { Connection } from 'rethinkdb-ts';

export class RethinkdbEventStore {
  constructor(public conn: Connection) {
  }
}
