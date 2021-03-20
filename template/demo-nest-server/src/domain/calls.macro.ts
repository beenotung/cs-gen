import { linesToCode, genCallTypes } from '../../../template/gen-code'
import { apiConfig, calls } from '../../../demo-config/src/calls'
import { andType } from 'gen-ts-type'

let serverCalls = calls.map(call => {
  return {
    ...call,
    In: andType(call.In, `{ Timestamp: number }`),
  }
})

let lines = genCallTypes(serverCalls)
lines.push(`export let apiConfig = ${JSON.stringify(apiConfig)}`)
linesToCode(lines)
