import { linesToCode } from '../../../template/gen-code'
import { apiConfig, calls } from '../../../demo-config/src/calls'

let lines: string[] = []
lines.push(`export let calls = ${JSON.stringify(calls, null, 2)}`)
lines.push(`export let apiConfig = ${JSON.stringify(apiConfig)}`)
linesToCode(lines)
