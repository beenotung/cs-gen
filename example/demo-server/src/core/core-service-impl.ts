import { CreateUser } from 'src/domain/types';

export class CoreServiceImpl {
  users: Array<{ UserId: string, UserName: string }> = [];

  CreateUser(In: CreateUser['In']): CreateUser['Out'] {
    if (this.users.find(x => x.UserId === In.UserId)) {
      return { Success: false, Reason: 'duplicated UserId' };
    }
    this.users.push(In);
    return { Success: true };
  }
}
