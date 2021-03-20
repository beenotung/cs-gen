import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import {
  Call,
  CreateUser,
  CheckUsername,
  SubscribeUsers,
  CancelSubscribe,
} from '../domain/calls'
import { LogicalProcessor } from '../domain/logical-processor'
import { Result } from '../lib/result'

@Injectable()
export class CoreService {
  constructor(public logicalProcessor: LogicalProcessor) {}

  Call(call: Omit<Call, 'Out'>): Result<Call['Out']> {
    switch (call.Type) {
      case 'CreateUser':
        return this.logicalProcessor.CreateUser(call.In as CreateUser['In'])
      case 'CheckUsername':
        return this.logicalProcessor.CheckUsername(
          call.In as CheckUsername['In'],
        )
      case 'SubscribeUsers':
        return this.logicalProcessor.SubscribeUsers(
          call.In as SubscribeUsers['In'],
        )
      case 'CancelSubscribe':
        return this.logicalProcessor.CancelSubscribe(
          call.In as CancelSubscribe['In'],
        )
      default:
        throw new HttpException('unknown type', HttpStatus.NOT_IMPLEMENTED)
    }
  }
}
