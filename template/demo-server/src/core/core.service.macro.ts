import { calls } from '../../../demo-common/src/calls';

function genCode() {
  let Types = calls.map(call=>call.Type)
  let code = `
import { Call${Types.map(Type=>`, ${Type}`).join('')} } from '../../../demo-common/src/calls'
import { LogicalProcessor } from '../domain/logical-processor'
import { Result } from '../lib/result'

export class CoreSerivce {

  constructor(public logicalProcessor: LogicalProcessor) {}
  ${calls.map(call=>`
  Call(call: Omit<${call.Type}, 'Out'>): Result<${call.Type}['Out']>`).join('')}
  {
    switch (call.Type) {${calls.map(
      (call) => `
      case '${call.Type}':
        return this.logicalProcessor.${call.Type}(call.In)`,
    ).join('')}
      default:
        throw new TypeError('unknown type')
    }
  }
}
`;
  return code.trim() + '\n';
}
genCode();
