import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LogicProcessor } from '../domain/logic-processor';
import {
  BlockUser,
  Call,
  CallInput,
  Command,
  CreateItem,
  CreateUser,
  GetProfile,
  GetUserList,
  Query,
  RenameUser,
  Subscribe,
  SubscribeItems
} from '../domain/types';



// tslint:disable:no-unused-variable
function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}
// tslint:enable:no-unused-variable

const impl = new LogicProcessor();

@Injectable()
export class CoreService {
  get impl() {
    return impl;
  }

  Call<C extends Call>(args: CallInput<C>): C['Out'] {
    const { CallType, Type, In } = args;
    const _type = Type as Call['Type'];
    let method: (In: C['In']) => C['Out'];
    switch (_type) {
      case 'CreateUser':
        // @ts-ignore
        method = this.CreateUser;
        break;
      case 'RenameUser':
        // @ts-ignore
        method = this.RenameUser;
        break;
      case 'CreateItem':
        // @ts-ignore
        method = this.CreateItem;
        break;
      case 'BlockUser':
        // @ts-ignore
        method = this.BlockUser;
        break;
      case 'GetProfile':
        // @ts-ignore
        method = this.GetProfile;
        break;
      case 'GetUserList':
        // @ts-ignore
        method = this.GetUserList;
        break;
      case 'SubscribeItems': {
        // @ts-ignore
        const m: (In: C['In']) => { id: string } = this.SubscribeItems;
        method = m as any;
        break;
      }
      default:
        const x: never = _type;
        console.log(`not implemented, CallType: ${CallType}, Type: ${Type}`);
        throw new HttpException('not implemented call type:' + x, HttpStatus.NOT_IMPLEMENTED);
    }
    method = method.bind(this);
    // TODO validate input
    const res = method(In);
    // TODO save the result
    return res;
  }

  CreateUser(In: CreateUser['In']): CreateUser['Out'] {
    return impl.CreateUser(In);
  }

  RenameUser(In: RenameUser['In']): RenameUser['Out'] {
    return not_impl('RenameUser');
  }

  CreateItem(In: CreateItem['In']): CreateItem['Out'] {
    return not_impl('CreateItem');
  }

  BlockUser(In: BlockUser['In']): BlockUser['Out'] {
    return not_impl('BlockUser');
  }

  GetProfile(In: GetProfile['In']): GetProfile['Out'] {
    return not_impl('GetProfile');
  }

  GetUserList(In: GetUserList['In']): GetUserList['Out'] {
    return not_impl('GetUserList');
  }

  SubscribeItems(In: SubscribeItems['In']): { id: string } | { error: any } {
    return not_impl('SubscribeItems');
  }
}
