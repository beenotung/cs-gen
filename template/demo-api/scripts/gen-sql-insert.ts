#!/usr/bin/env ts-node
import { join } from 'path'
import { genInsertFile } from '../helpers/gen-sql-insert'
import { callMetas } from '../config/call-meta'

genInsertFile(
  callMetas,
  join('src', 'insert-logs.ts'),
  `import { db } from '../config/db'`,
)
