import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { LogicProcessor } from '../domain/logic-processor'
import {
  Call,
  CallInput,
  CancelSubscribe,
  DeleteByKey,
  GetValue,
  ListKeys,
  SetKV,
  SubscribeByKey,
} from '../domain/types'
import { Result } from '../lib/result'

// tslint:disable-next-line:no-unused-declaration
function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED)
}

const impl = new LogicProcessor()

@Injectable()
export class CoreService {
  get impl() {
    return impl
  }

  Call<C extends Call>(args: CallInput<C>): Result<C['Out']> {
    const { CallType, Type, In } = args
    const _type = Type as Call['Type']
    let method: (In: C['In']) => C['Out']
    switch (_type) {
      case 'CancelSubscribe':
        // @ts-ignore
        method = this.CancelSubscribe
        break
      case 'SetKV':
        // @ts-ignore
        method = this.SetKV
        break
      case 'DeleteByKey':
        // @ts-ignore
        method = this.DeleteByKey
        break
      case 'GetValue':
        // @ts-ignore
        method = this.GetValue
        break
      case 'ListKeys':
        // @ts-ignore
        method = this.ListKeys
        break
      case 'SubscribeByKey': {
        // @ts-ignore
        const m: (In: C['In']) => { id: string } = this.SubscribeByKey
        method = m as any
        break
      }
      default:
        const x: never = _type
        console.log(`not implemented, CallType: ${CallType}, Type: ${Type}`)
        throw new HttpException(
          'not implemented call type:' + x,
          HttpStatus.NOT_IMPLEMENTED,
        )
    }
    method = method.bind(this)
    // TODO validate input
    const res = method(In)
    // TODO save the result
    return res
  }

  CancelSubscribe(In: CancelSubscribe['In']): Result<CancelSubscribe['Out']> {
    return impl.CancelSubscribe(In)
  }

  SetKV(In: SetKV['In']): Result<SetKV['Out']> {
    return impl.SetKV(In)
  }

  DeleteByKey(In: DeleteByKey['In']): Result<DeleteByKey['Out']> {
    return impl.DeleteByKey(In)
  }

  GetValue(In: GetValue['In']): Result<GetValue['Out']> {
    return impl.GetValue(In)
  }

  ListKeys(In: ListKeys['In']): Result<ListKeys['Out']> {
    return impl.ListKeys(In)
  }

  SubscribeByKey(
    In: SubscribeByKey['In'],
  ): Result<{ id: string } | { error: any }> {
    return impl.SubscribeByKey(In)
  }
}
