import { catchMain } from '@beenotung/tslib/node';
import * as path from 'path';
import { genProject } from '../src/gen/gen-file';
import { flattenCallMetas } from '../src/utils';

const rimraf = require('rimraf');

const userIdType = '{ UserId: string }';
const userType = '{ UserId: string, UserName?: string }';
const successType = '({ Success: true } | { Success: false; Reason: string })';
const subscribeOutType = '{ id: string }';
export let callTypes = flattenCallMetas({
  commandTypes: [
    { Type: 'CreateUser', In: userType, Out: successType },
    {
      Type: 'RenameUser',
      In: '{ UserId: string, NewUsername: string }',
      Out: successType,
    },
    {
      Type: 'CreateItem',
      In: '{ ItemName: string, UserId: string }',
      Out: successType,
    },
    {
      Type: 'BlockUser',
      In: `{ UserId: string }`,
      Out: successType,
      Admin: true,
    },
  ],
  queryTypes: [
    { Type: 'GetProfile', In: userIdType, Out: userType },
    { Type: 'GetUserList', In: 'void', Out: `Array<${userType}>` },
  ],
  subscribeTypes: [
    { Type: 'SubscribeItems', In: 'void', Out: subscribeOutType },
  ],
});

async function test() {
  const outDirname = path.join('example');
  if (!'dev') {
    console.log('clearing out folder...');
    rimraf.sync(outDirname);
  }

  console.log('generating project...');

  await genProject({
    outDirname,
    baseProjectName: 'demo',
    serverProjectName: 'demo-server', // optional
    clientProjectName: 'demo-client', // optional
    callTypes: callTypes,
    // forceOptionalToUndefined: true,
    // injectTimestampField: false,
    // primusGlobalName: 'AppPrimus',
    // primusPath: 'app-primus',
    // ws: false,
    staticControllerReference: true,
    asyncLogicProcessor: true,
    // serverOrigin: 'https://api.example.com'
    serverOrigin: {
      port: 3000,
      test: 'https://api.example.com',
      prod: 'https://api.example.com',
    },
  });

  console.log('all passed.');
}

catchMain(test());
