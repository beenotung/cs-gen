import { catchMain } from '@beenotung/tslib/node';
import { genProject } from '../src/gen/gen-file';
import * as path from 'path';

const rimraf = require('rimraf');

async function test() {
  let outDirname = path.join('out', 'gen');
  if (!'dev') {
    console.log('clearing out folder...');
    rimraf.sync(outDirname);
  }

  let userIdType = '{ UserId: string }';
  let userType = '{ UserId: string, UserName: string }';
  let successType = '({ Success: true } | { Success: false; Reason: string })';

  console.log('generating project...');
  await genProject({
    outDirname,
    projectName: 'demo-server',
    queryTypes: [
      { Type: 'GetProfile', In: userIdType, Out: userType },
      { Type: 'GetUserList', In: 'void', Out: `Array<${userType}>` },
    ],
    commandTypes: [
      { Type: 'CreateUser', In: userType, Out: successType },
      {
        Type: 'RenameUser',
        In: '{ UserId: string, NewUsername: string }',
        Out: successType,
      },
    ],
  });

  console.log('all passed.');
}

catchMain(test());
