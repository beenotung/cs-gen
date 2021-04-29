#!/usr/bin/env ts-node
import { callMetas } from '../config/call-meta'
import { genCallIds } from '../helpers/gen-ts-ids'
import { saveCode } from '../helpers/fs'

saveCode(genCallIds(callMetas), 'src', 'ids.ts')
