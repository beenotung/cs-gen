import { callMetas } from '../config/call-meta'
import { genApplyCall } from '../helpers/gen-apply-call'
import { logicalProcessor } from './instances'
;`
import { Context } from './engine-helpers'
import { logicalProcessor } from './instances'
import { CallIn, CallOut } from './types'

${genApplyCall(callMetas, logicalProcessor)}
`
