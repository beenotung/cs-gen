import { cqrsEngine } from '../src/config/values';
import { CreateUser, UserCommandType } from '../src/models/user/user.command.type';

cqrsEngine.fireCommand({
  id: 'c1',
  type: UserCommandType.CreateUser,
  payload: {
    user_id: 'u1',
    username: 'beeno',
  } as CreateUser,
});
