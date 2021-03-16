import {
  Call,
  CreateUser,
  CheckUsername,
  SubscribeUsers,
} from '../../../demo-common/src/calls'
import { LogicalProcessor } from '../domain/logical-processor'
import { Result } from '../lib/result'

export class CoreSerivce {
  constructor(public logicalProcessor: LogicalProcessor) {}

  Call(call: Omit<CreateUser, 'Out'>): Result<CreateUser['Out']>
  Call(call: Omit<CheckUsername, 'Out'>): Result<CheckUsername['Out']>
  Call(call: Omit<SubscribeUsers, 'Out'>): Result<SubscribeUsers['Out']> {
    switch (call.Type) {
      case 'CreateUser':
        return this.logicalProcessor.CreateUser(call.In)
      case 'CheckUsername':
        return this.logicalProcessor.CheckUsername(call.In)
      case 'SubscribeUsers':
        return this.logicalProcessor.SubscribeUsers(call.In)
      default:
        throw new TypeError('unknown type')
    }
  }
}
