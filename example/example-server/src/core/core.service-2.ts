import { HttpException, HttpStatus } from '@nestjs/common';
import { LogicProcessor } from '../domain/logic-processor';
import { Call, CallInput, CancelSubscribe, DeleteByKey, GetValue, ListKeys, SetKV, SubscribeByKey } from '../domain/types';
import { Result } from '../lib/result';
import { calls } from './calls';
const callTypes = new Set(calls.map(call => call.Type));
declare var React: any;

function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}

const impl = new LogicProcessor();
export class CoreService {
  get impl() {
    return impl;
  }

  Call<C extends Call>(args: CallInput<C>): Result<C['Out']> {
    const {
      CallType,
      Type,
      In
    } = args;

    if (!callTypes.has(Type)) {
      console.log(`not implemented, CallType: ${CallType}, Type: ${Type}`);
      throw new HttpException('not implemented call type:' + Type, HttpStatus.NOT_IMPLEMENTED);
    }

    let method: (In: C['In']) => C['Out'] = this[(Type as Call['Type'] & keyof typeof CoreService)];

    if (typeof method !== 'function') {
      console.log(`invalid call , CallType: ${CallType}, Type: ${Type}`);
      throw new HttpException('invalid call type:' + Type, HttpStatus.BAD_REQUEST);
    }

    method = method.bind(this);
    const res = method(In);
    return res;
  }

  CancelSubscribe(In: CancelSubscribe['In']): Result<CancelSubscribe['Out']> {
    return impl.CancelSubscribe(In);
  }

  SetKV(In: SetKV['In']): Result<SetKV['Out']> {
    return impl.SetKV(In);
  }

  DeleteByKey(In: DeleteByKey['In']): Result<DeleteByKey['Out']> {
    return impl.DeleteByKey(In);
  }

  GetValue(In: GetValue['In']): Result<GetValue['Out']> {
    return impl.GetValue(In);
  }

  ListKeys(In: ListKeys['In']): Result<ListKeys['Out']> {
    return impl.ListKeys(In);
  }

  SubscribeByKey(In: SubscribeByKey['In']): Result<{
    id: string;
  } | {
    error: any;
  }> {
    return impl.SubscribeByKey(In);
  }

}