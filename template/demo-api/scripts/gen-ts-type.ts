#!/usr/bin/env ts-node
import { writeFileSync } from 'fs'
import { join } from 'path'
import { genTsType } from '../helpers/gen-ts-type'
import { callMetas } from '../config/call-meta'

writeFileSync(join('src', 'types.ts'), genTsType(callMetas))
