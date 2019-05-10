import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Call, CreateUser, GetProfile, GetUserList, RenameUser } from '../domain/types';
import { CoreServiceImpl } from './core-service-impl';

function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}

@Injectable()
export class CoreService {
  impl = new CoreServiceImpl();

  Call<C extends Call>(Type: C['Type']): (In: C['In']) => C['Out'] {
    const _type = Type as Call['Type'];
    let res: (In: C['In']) => C['Out'];
    switch (_type) {
      case 'GetProfile':
        res = this.GetProfile;
        break;
      case 'GetUserList':
        res = this.GetUserList;
        break;
      case 'CreateUser':
        res = this.CreateUser;
        break;
      case 'RenameUser':
        res = this.RenameUser;
        break;
      default:
        const x: never = _type;
        console.log('not implemented call type:', x);
        throw new HttpException('not implemented call type:' + x, HttpStatus.NOT_IMPLEMENTED);
    }
    return res.bind(this);
  }

  GetProfile(In: GetProfile['In']): GetProfile['Out'] {
    return not_impl('GetProfile');
  }

  GetUserList(In: GetUserList['In']): GetUserList['Out'] {
    return not_impl('GetUserList');
  }

  CreateUser(In: CreateUser['In']): CreateUser['Out'] {
    return this.impl.CreateUser(In);
  }

  RenameUser(In: RenameUser['In']): RenameUser['Out'] {
    return not_impl('RenameUser');
  }
}
