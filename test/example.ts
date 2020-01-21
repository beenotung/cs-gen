import { createDatabase, getAllEvents, storeMessage } from '../src/db';
import { createEvent, set_app_id } from '../src/helpers';
import { BaseMessageType, EventType } from '../src/types';

interface AttemptedCall extends EventType {
  event_type: 'attempted_call'
  payload: {
    token: string
    call_type: string
    payload?: any
  }
}

interface AuthenticatedCall extends EventType {
  event_type: 'authenticated_call'
  payload: {
    app_id: string
    user_id: string
    call_type: string
    payload?: any
  }
}

async function test() {
  set_app_id('test');
  let db = createDatabase<BaseMessageType>({ filename: 'test.db' });

  let attemptCall: EventType = createEvent({
    event_type: 'attempt_call',
    payload: {
      action: 'CreatePost',
      post: {
        author: 'user-1',
        title: 'Hi',
      },
    },
  });

  console.log('try to store attemptCall');
  await storeMessage(db, attemptCall);
  console.log('stored attemptCall');

  getAllEvents(db, {
    selector: {
      app_id: 'test',
      event_type: 'attempt_call',
    },
    onError: err => {
      return console.error(err);
    },
    onEvents: response => {
      console.dir(response, { depth: 99 });
      let sorted = true;
      response.events.reduce((acc, c) => {
        sorted = sorted && c.create_timestamp >= acc.create_timestamp;
        return c;
      });
      console.log({ sorted });
      console.log({ ids: response.events.map(event => event._id).join(', ') });
    },
  });
}

test();
