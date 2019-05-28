import { checkCallType } from '../src/utils';

export type Query = {
  CallType: 'Query';
  Type: 'GetProfile';
  In: { UserId: string };
  Out: { UserId: string; UserName: string };
};
export type Command = {
  CallType: 'Command';
  Type: 'CreateProfile';
  In: { UserId: string; UserName: string };
  Out: { Success: boolean };
};

checkCallType({} as Query);
checkCallType({} as Command);
