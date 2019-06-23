import { catchMain } from '@beenotung/tslib/node';
import * as path from 'path';
import { flattenCallTypes } from '../src';
import { genProject } from '../src/gen/gen-file';

const rimraf = require('rimraf');

const userIdType = '{ UserId: string }';
const userType = '{ UserId: string, UserName: string }';
const successType = '({ Success: true } | { Success: false; Reason: string })';
const subscribeOutType = '{ id: string }';
export let callTypes = flattenCallTypes({
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
    serverProjectName: 'demo-server',
    clientProjectName: 'demo-client',
    callTypes: callTypes,
  });

  console.log('all passed.');
}

catchMain(test());
