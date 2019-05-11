import 'cqrs-exp';
import { CoreService } from '../src/core/core.service';
import { CreateUser } from '../src/domain/types';
import { CoreController } from '../src/core/core.controller';
import cliProgress = require('cli-progress');

let cs = new CoreService();
let cc = new CoreController(cs);

function test() {
  const bar = new cliProgress.Bar({});
  let n = 10000;
  bar.start(n, 0);
  for (let i = 0; i < n; i++) {
    const UserId = 'u-' + i;
    const UserName = 'user-' + i;
    cc.call<CreateUser>({ Type: 'CreateUser', In: { UserId, UserName } });
    bar.increment(1);
  }
  bar.stop();
}

test();
