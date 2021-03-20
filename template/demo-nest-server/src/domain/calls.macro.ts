import { linesToCode, genCallTypes } from '../../../template/gen-code'
import { calls } from '../../../demo-config/src/calls'
import { andType } from 'gen-ts-type'

let serverCalls = calls.map(call => {
  return {
    ...call,
    In: andType(call.In, `{ Timestamp: number }`),
  }
})

linesToCode(genCallTypes(serverCalls))
