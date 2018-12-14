import { prop, Typegoose } from 'typegoose';
import { Types } from 'mongoose';

export class User extends Typegoose {
  @prop({ _id: true })
  id: Types.ObjectId;

  @prop({ required: true })
  username: string;

  @prop()
  mobile_tel?: string;
}

export const UserModel = new User().getModelForClass(User);
