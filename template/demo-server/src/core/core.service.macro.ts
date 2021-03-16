import { calls } from '../domain/calls'

function genCode() {
  let Types = calls.map(call => call.Type)
  let code = `
import { Call, ${Types.join(', ')} } from '../domain/calls'
import { LogicalProcessor } from '../domain/logical-processor'
import { Result } from '../lib/result'

export class CoreService {

  constructor(public logicalProcessor: LogicalProcessor) {}

  Call(call: Omit<Call, 'Out'>): Result<Call['Out']> {
    switch (call.Type) {`
  for (let Type of Types) {
    code += `
      case '${Type}':
        return this.logicalProcessor.${Type}(call.In as ${Type}['In'])`
  }
  code += `
      default:
        throw new TypeError('unknown type')
    }
  }
}
`
  return code.trim() + '\n'
}
genCode()
