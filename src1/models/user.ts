import { HttpStatus } from '@nestjs/common';
import { prop } from 'typegoose';
import { eventStore, stateStore } from '../config/values';
import { EventHeight } from '../lib/cqrs/impl/common';
import { GeneralModel } from '../lib/cqrs/impl/model';
import { CqrsEngine } from '../lib/cqrs/types/api.types';
import {
  Command,
  ConcreteTypeSelector,
  Event,
  id,
} from '../lib/cqrs/types/data.types';
import { EventStore, StateStore } from '../lib/cqrs/types/store.types';
import { mkId } from '../lib/cqrs/utils';
import { apiFail, apiSuccess } from '../utils/api-standard';
import { CreateUser, UserCmdType } from './user.cmd';
import {
  UserCreated,
  UserEvent,
  UserEventType,
  UserEventTypes,
} from './user.event';
import { GetUser, UserQueryType, UserQueryTypes } from './user.query';

export let UserType = 'User';

export class User {
  @prop({ required: true })
  id: id;

  @prop({ required: true })
  username: string;
}

export class UserModel extends GeneralModel<User, UserEvent> {
  eventTypes: ConcreteTypeSelector = UserEventTypes;
  objectType: string = UserType;

  constructor(cqrs: CqrsEngine) {
    super();

    /* query */
    cqrs.registerQueryHandler({
      queryTypes: UserQueryTypes,
      handle: async query => {
        const store = await this.getStateStore();
        switch (query.type) {
          case UserQueryType.GetUser: {
            const q = query.payload as GetUser;
            const users = await store.find(
              [UserType],
              x => (x.payload as User).username === q.username,
            );
            if (users.length !== 1) {
              return apiFail(
                HttpStatus.NOT_FOUND,
                'no user match username: ' + q.username,
              );
            }
            return apiSuccess(users[0]);
          }
        }
      },
    });

    /* command */
    cqrs.registerCommandHandler({
      commandTypes: [UserCmdType.CreateUser],
      handle: async command => {
        const c = (command as Command<CreateUser>).payload;
        const event: UserCreated = {
          id: c.id,
          username: c.username,
        };
        return [
          {
            id: mkId(UserEventType.UserCreated, c.id),
            type: UserEventType.UserCreated,
            payload: event,
          },
        ];
      },
    });
  }

  async getEventStore(eventType: string): Promise<EventStore<UserCreated>> {
    return eventStore;
  }

  async getStateStore(): Promise<StateStore<User | EventHeight>> {
    return stateStore;
  }

  async handleEvents(events: Array<Event<UserCreated>>): Promise<void> {
    const store = await this.getStateStore();
    for (const event of events) {
      switch (event.type) {
        case UserEventType.UserCreated: {
          const e = (event as Event<UserCreated>).payload;
          const oldUser = await store.get(e.id);
          if (oldUser) {
            console.warn('skip create user, duplicated id: ' + e.id);
            continue;
          }
          const user: User = {
            id: e.id,
            username: e.username,
          };
          await store.store({
            id: e.id,
            type: UserType,
            payload: user,
            version: 1,
          });
          break;
        }
        default:
          console.warn('skip event, unknown type: ' + event.type);
      }
    }
  }
}
