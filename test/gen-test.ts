import { catchMain } from '@beenotung/tslib/node';
import { genProject } from '../src/gen/gen-file';
import * as path from 'path';
import { flattenCallTypes } from '../src';

const rimraf = require('rimraf');

async function test() {
  const outDirname = path.join('example');
  if (!'dev') {
    console.log('clearing out folder...');
    rimraf.sync(outDirname);
  }

  const userIdType = '{ UserId: string }';
  const userType = '{ UserId: string, UserName: string }';
  const successType =
    '({ Success: true } | { Success: false; Reason: string })';

  console.log('generating project...');
  await genProject({
    outDirname,
    projectName: 'demo-server',
    callTypes: flattenCallTypes({
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
      mixedTypes: [],
    }),
  });

  console.log('all passed.');
}

catchMain(test());
