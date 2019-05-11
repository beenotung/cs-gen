import { catchMain } from '@beenotung/tslib/node';
import { CoreProvider } from '../src/core.service';
import { CreateUser } from '../src/lib';

const l = new CoreProvider();

async function test() {
  const { Out } = await l.call<CreateUser>({ Type: 'CreateUser', In: { UserId: 'local-1', UserName: 'Local Alice' } });
  console.log({ Out });
}

catchMain(test());
