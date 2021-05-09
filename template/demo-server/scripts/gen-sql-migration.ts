#!/usr/bin/env ts-node
import {
  genMigrationFile,
  genNextMigrationFilename,
} from '../macro-helpers/gen-sql-migration'
import { callMetas } from '../config/call-meta'
import { db, migrationsPath } from '../domain/db/config'

genMigrationFile(callMetas, db, genNextMigrationFilename(migrationsPath))
