#!/usr/bin/env ts-node
import { genTsType } from '../helpers/gen-ts-type'
import { callMetas } from '../config/call-meta'
import { saveCode } from '../helpers/fs'

saveCode(genTsType(callMetas), 'src', 'types.ts')
