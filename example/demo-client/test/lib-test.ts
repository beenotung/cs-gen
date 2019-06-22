import { catchMain } from '@beenotung/tslib/node';
import { CreateUser, startPrimus } from '../src/domain/api';

let primus = startPrimus('http://localhost:3000');

async function test() {
  const Out = await CreateUser({ UserId: 'local-2', UserName: 'Local Bob' });
  console.log({ Out });
}

catchMain(test());
