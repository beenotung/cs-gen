#!/usr/bin/env ts-node
import {
  genMigrationFile,
  genNextMigrationFilename,
} from '../helpers/gen-sql-migration'
import { callMetas } from '../config/call-meta'
import { db, migrationsPath } from '../config/db'

genMigrationFile(callMetas, db, genNextMigrationFilename(migrationsPath))
