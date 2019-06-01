import { Db } from '../src/store/db';
import { catchMain } from '@beenotung/tslib/node';

let db = new Db({
  connectionOptions: {
    // host: 'localhost',
    host: '192.168.1.27',
  },
});

async function test() {
  await db.storeEvent({
    aggregate_id: 'user',
    command_id: '1',
    timestamp: Date.now(),
    event_type: 'register_user',
    username: 'Alice',
  });
  let cursor = await db.subEvents('user');
  cursor.each(
    (err, row) => {
      console.log('sub user event each:', { err, row });
    },
    () => {
      console.log('sub user event done');
    },
  );
  setTimeout(() => {
    console.log('stop now');
    cursor.close(err => {
      console.log({ err });
      db.close();
    });
  }, 5000);
}

catchMain(test());
