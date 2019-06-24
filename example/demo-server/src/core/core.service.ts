import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  Call,
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
import { LogicProcessor } from '../domain/logic-processor';
import { CallInput } from 'cqrs-exp';

function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}

@Injectable()
export class CoreService {
  impl = new LogicProcessor();

  Call<C extends Call>(args: CallInput<C>): C['Out'] {
    const { CallType, Type, In } = args;
    const _type = Type as Call['Type'];
    let method: (In: C['In']) => C['Out'];
    switch (_type) {
      case 'CreateUser':
        method = this.CreateUser;
        break;
      case 'RenameUser':
        method = this.RenameUser;
        break;
      case 'CreateItem':
        method = this.CreateItem;
        break;
      case 'GetProfile':
        method = this.GetProfile;
        break;
      case 'GetUserList':
        method = this.GetUserList;
        break;
      case 'SubscribeItems': {
        const m: (In: C['In']) => { id: string } = this.SubscribeItems;
        method = m as any;
        break;
      }
      default:
        const x: never = _type;
        console.log('not implemented call type:', x);
        throw new HttpException('not implemented call type:' + x, HttpStatus.NOT_IMPLEMENTED);
    }
    method = method.bind(this);
    // TODO validate input
    const res = method(In);
    // TODO save the result
    return res;
  }

  CreateUser(In: CreateUser['In']): CreateUser['Out'] {
    return this.impl.CreateUser(In);
  }

  RenameUser(In: RenameUser['In']): RenameUser['Out'] {
    return not_impl('RenameUser');
  }

  CreateItem(In: CreateItem['In']): CreateItem['Out'] {
    return not_impl('CreateItem');
  }

  GetProfile(In: GetProfile['In']): GetProfile['Out'] {
    return not_impl('GetProfile');
  }

  GetUserList(In: GetUserList['In']): GetUserList['Out'] {
    return not_impl('GetUserList');
  }

  SubscribeItems(In: SubscribeItems['In']): { id: string } {
    return not_impl('SubscribeItems');
  }
}
