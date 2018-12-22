import { Types } from 'mongoose';
import { prop, Typegoose } from 'typegoose';
import { eventStore } from '../../config/values';
import { Event } from '../../lib/cqrs/types';
import { UserCreated, UserEvents, UserPhoneUpdated } from './user.events';

export class User extends Typegoose {
  @prop({ _id: true })
  id: Types.ObjectId;

  @prop({ required: true })
  username: string;

  @prop()
  mobile_tel?: string;
}

export const UserModel = new User().getModelForClass(User);

eventStore.subscribe(
  UserEvents.UserCreated,
  async (event: Event<UserCreated>) => {
    const d = new UserModel();
    d.id = event.payload.user_id;
    d.username = event.payload.username;
    await d.save();
  },
);
eventStore.subscribe(
  UserEvents.UserPhoneUpdated,
  async (event: Event<UserPhoneUpdated>) => {
    const $set = {} as User;
    $set.mobile_tel = event.payload.phone;
    return UserModel.findByIdAndUpdate(event.payload.user_id, { $set });
  },
);
