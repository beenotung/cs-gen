import DB from 'better-sqlite3-helper'
import { join } from 'path'

const dataDir = 'data'

export const migrationsPath = 'migrations'

export const db = DB({
  path: join(dataDir, 'log.db'),
  fileMustExist: false,
  readonly: false,
  migrate: {
    migrationsPath,
    table: 'migration',
    force: false,
  },
})
