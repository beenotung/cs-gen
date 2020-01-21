import { EventEmitter } from 'stream';
import PouchDB from 'pouchdb-core';
import 'pouchdb-find';
import { BaseMessageType } from './types';

PouchDB.plugin(require('pouchdb-adapter-node-websql'));
PouchDB.plugin(require('pouchdb-find'));

let changeEmitter = new EventEmitter();
let INSERT = 'insert';

function createIndex(db: PouchDB.Database) {
  db.createIndex({
    index: {
      fields: ['create_timestamp'],
      name: 'create_timestamp_index',
    },
  })
    .then((res) => {
      switch (res.result) {
        case 'exists':
        case 'created':
          return; // expected result
      }
      console.debug('create index result:', res.result);
    })
    .catch(err => {
      console.error('failed to create index:', err);
    });
}

export function createDatabase<T>({ filename }: { filename: string }) {
  let db = new PouchDB<T>(filename, { adapter: 'websql' });
  return db;
}

export function storeMessage(db: PouchDB.Database, message: BaseMessageType) {
  return db.put({
    _id: message.message_id,
    ...message,
  }).then(res => {
    changeEmitter.emit(INSERT);
    return res;
  });
}

export function storeMessages(db: PouchDB.Database, messages: BaseMessageType[]) {
  return db.bulkDocs(messages.map(message => {
    return {
      _id: message.message_id,
      ...message,
    };
  })).then(res => {
    changeEmitter.emit(INSERT);
    return res;
  });
}

export function getAllMessages(db: PouchDB.Database) {
  return db.allDocs({ include_docs: true, descending: false });
}

export interface GetEventsResponse<T> {
  offset: number
  total_rows?: number
  fetched_rows: number
  events: Array<T & { _id: string, _rev: string }>
}

export interface GetEventsOptions<T> {
  selector?: PouchDB.Find.Selector
  fields?: string[]
  skip: number
  limit: number
  onEvents: (response: GetEventsResponse<T>) => void
  onError: (err: any) => void
}

export function getEvents<T>(db: PouchDB.Database<T>, { selector, fields, skip, limit, onEvents, onError }: GetEventsOptions<T>) {
  if (selector) {
    db.find({
      selector,
      skip, limit, fields,
      // sort: [{ create_timestamp: 'asc' }], // FIXME
      // use_index: 'create_timestamp_index', // FIXME
    })
      .then(response => {
        onEvents({
          offset: skip,
          fetched_rows: response.docs.length,
          events: response.docs,
        });
      })
      .catch(onError);
    return;
  }
  db.allDocs<T>({
    include_docs: true, descending: false,
    skip, limit,
  })
    .then(response => {
      onEvents({
        offset: response.offset,
        total_rows: response.total_rows,
        fetched_rows: response.rows.length,
        events: response.rows
        // TODO validate with schema register
          .filter(row => row.doc !== undefined)
          .map(row => row.doc!),
      });
    })
    .catch(onError);
}

export interface GetAllEventsOptions<T> {
  batchSize?: number // default 200
  selector?: PouchDB.Find.Selector
  fields?: string[]
  skip?: number
  onEvents: (response: GetEventsResponse<T>) => void
  onError: (err: any) => void
}

export function getAllEvents<T extends BaseMessageType>(db: PouchDB.Database<T>, options: GetAllEventsOptions<T>) {
  let limit = options.batchSize || 200;
  let skip = options.skip || 0;

  function listenToChanges() {
    changeEmitter.once(INSERT, fetchNextBatch);
  }

  function fetchNextBatch() {
    getEvents<T>(db, {
      ...options,
      limit, skip,
      onEvents: response => {
        if (response.fetched_rows === 0) {
          return listenToChanges(); // wait for change
        }
        options.onEvents(response);
        skip += response.fetched_rows;
        fetchNextBatch();
      },
    });
  }

  fetchNextBatch();
}
