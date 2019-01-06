import { ObjectId } from 'bson';
import { Types } from 'mongoose';
import { prop, Typegoose } from 'typegoose';
import { cqrsEngine } from '../../config/values';
import { Query } from '../../lib/cqrs/types';
import {
  registerQueryByEnumList,
  subscribeEventByEnumList,
} from '../../lib/cqrs/utils';
import {
  UserCreated,
  UserEventType,
  UserPhoneUpdated,
} from './user.event.type';
import {
  GetUserById,
  GetUserByUsername,
  UserQueryInputType,
} from './user.query.type';

export class User extends Typegoose {
  @prop({ _id: true })
  id: Types.ObjectId;

  @prop({ required: true })
  username: string;

  @prop()
  mobile_tel?: string;
}

export type UserQueryResultType = User;

export type UserQueryType =
  | Query<UserQueryInputType.GetUserByUsername, User>
  | Query<UserQueryInputType.GetUserById, User>;

export const UserModel = new User().getModelForClass(User);

subscribeEventByEnumList(cqrsEngine, [
  [
    UserEventType.UserCreated,
    async event => {
      const payload = (event.payload as unknown) as UserCreated;
      const user = new User();
      user.id = new ObjectId(payload.user_id);
      user.username = payload.username;
      await UserModel.create(user);
    },
  ],
  [
    UserEventType.UserPhoneUpdated,
    async event => {
      const payload = (event.payload as unknown) as UserPhoneUpdated;
      const user = new User();
      user.id = new ObjectId(payload.user_id);
      user.mobile_tel = payload.phone;
      await UserModel.updateOne({ _id: user.id }, { $set: user });
    },
  ],
]);

registerQueryByEnumList(cqrsEngine, [
  [
    UserQueryInputType.GetUserByUsername,
    async query => {
      const payload = (query.payload as unknown) as GetUserByUsername;
      const user = new User();
      user.username = payload.username;
      return await UserModel.findOne(user);
    },
  ],
  [
    UserQueryInputType.GetUserById,
    async query => {
      const payload = (query.payload as unknown) as GetUserById;
      const user = new User();
      user.id = new ObjectId(payload.user_id);
      return await UserModel.findOne(user);
    },
  ],
]);
