import { EOL } from 'os'
import { callMetas } from '../config/call-meta'
import { toTsMethodName, toTsTypeName } from '../helpers/gen-ts-type'

let code = `
import type { Context } from './engine-helpers'
import type { Result } from './types'
import type * as t from './types'

export interface ILogicalProcessor {`
callMetas.forEach(call => {
  const type = 't.' + toTsTypeName(call.type)
  const method = toTsMethodName(call.type)
  code += EOL + `  ${method}(input: ${type}['in'], context: Context): Result<${type}>`
})
code += EOL + `}`

code.trim() + EOL
