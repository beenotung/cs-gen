import DB from "better-sqlite3-helper";
import {join} from 'path'
import {existsSync, mkdirSync} from 'fs'

if (!existsSync('data')) {
  mkdirSync('data')
}

export let db = DB({
  path: join('data', 'log.db'),
  fileMustExist: false,
  readonly: false,
  migrate: {
    migrationsPath: 'migrations',
    table: 'migration',
    force: false,
  },
})
