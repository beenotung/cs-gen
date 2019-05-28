import { YEAR } from '@beenotung/tslib/time';
import { genTypeCode } from '../src/gen/gen-code';

let UserDemo = {
  UserId: 'u101',
  UserName: 'Alice',
  DateOfBirth: Date.now() - 20 * YEAR,
  Type: 'Admin',
};
// let tsType = getTsType(UserDemo);
// console.log(`export type User = ${tsType};`);
console.log(genTypeCode('User', UserDemo));
