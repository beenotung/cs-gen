import { appServer } from '../src/demo/app/main';

setTimeout(() => {
  const res = appServer.query({
    type: 'ListUser',
  });
  console.log('query result:', res);
}, 1000 * 2);

setTimeout(() => {
  const res = appServer.command({
    type: 'RegisterUser',
    command: {
      user_id: 'beeno1001',
      nickname: 'Beeno',
    },
  });
  console.log('command result:', res);
}, 1000);
