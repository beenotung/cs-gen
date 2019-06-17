import { CoreController } from '../src/core/core.controller';
import 'cqrs-exp';
import { CoreService } from '../src/core/core.service';
import { CreateUser } from '../src/domain/types';

let cs = new CoreService();
let cc = new CoreController(cs);

async function test() {
  let users = cs.impl.users;
  console.log('before import, users:', users);

  let out = await cc.call<CreateUser>({
    Type: 'CreateUser',
    In: { UserId: 'u101', UserName: 'Alice' },
  });
  console.log('test:', { out });

  out = await cc.call<CreateUser>({
    Type: 'CreateUser',
    In: { UserId: 'u' + users.length, UserName: 'Alice-' + users.length },
  });
  console.log('test:', { out });

  console.log('after import, users:', users);
}

test();
