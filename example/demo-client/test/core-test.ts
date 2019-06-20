import { catchMain } from '@beenotung/tslib/node';
import { CoreService } from '../src/core.service';
import { CreateUser } from '../../demo-server/src/domain/types';

const l = new CoreService('http://localhost:3000');

async function test() {
  const Out = await l.Call<CreateUser>({
    CallType: 'Command',
    Type: 'CreateUser',
    In: { UserId: 'local-1', UserName: 'Local Alice' },
  });
  console.log({ Out });
}

catchMain(test());
