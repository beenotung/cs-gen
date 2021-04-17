#!/usr/bin/env ts-node
import { writeFileSync } from 'fs'
import { join } from 'path'
import { genTsTypes } from '../helpers/gen-ts-types'
import { callMetas } from '../config/call-meta'

writeFileSync(join('src', 'types.ts'), genTsTypes(callMetas))
