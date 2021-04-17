#!/usr/bin/env ts-node
import { genInsertFile } from '../helpers/gen-sql-insert'
import { callMetas } from '../config/call-meta'

genInsertFile(
  callMetas,
  'src/insert-logs.ts',
  `import { db } from '../config/db'`,
)
