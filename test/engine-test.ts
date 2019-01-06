import { cqrsEngine } from '../src/config/values';

async function test() {
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
