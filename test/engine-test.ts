import { cqrsEngine } from '../src/config/values';
import { later } from '@beenotung/tslib/async/wait';

async function test() {
  await later(5000);
  await cqrsEngine.fireCommand({
    type: 'CreateUser',
    data: {
      id: 'u1',
      username: 'beeno',
    },
  });
  const user = cqrsEngine.query({
    type: 'FindUserById',
    data: { id: 'u1' },
  });
  console.log('res:', user);
}

test();
