import 'cqrs-exp';
import { CreateUser } from '../src/domain/types';
import * as path from 'path';
import { CallInput, LogService } from 'cqrs-exp';
import cliProgress = require('cli-progress');

let logService = new LogService(path.join('data', 'log'));

async function test() {
  const bar = new cliProgress.Bar({});
  let n = 10000;
  bar.start(n, 0);
  for (let i = 0; i < n; i++) {
    const UserId = 'u-' + i;
    const UserName = 'user-' + i;
    let body: CallInput<CreateUser> = { CallType: 'Command', Type: 'CreateUser', In: { UserId, UserName, Timestamp: Date.now() } };
    await logService.storeObject(body);
    bar.increment(1);
  }
  bar.stop();
}

test();
