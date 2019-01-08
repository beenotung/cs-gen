import { enum_keys } from '@beenotung/tslib/enum';

enum UserEvent {
  UserCreated,
  ProfileUpdated,
}

console.log(enum_keys(UserEvent));
