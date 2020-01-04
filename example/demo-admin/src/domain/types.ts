export type BlockUser = {
  CallType: 'Command';
  Type: 'BlockUser',
  In: { UserId: string },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};

export type Command = BlockUser;


export type Query = never;


export type Subscribe = never;

export type Call = Command | Query | Subscribe;

export interface CallInput<C extends Call = Call> {
  CallType: C['CallType'];
  Type: C['Type'];
  In: C['In'];
}

function checkCallType(_t: {
  CallType: 'Command' | 'Query' | 'Subscribe';
  Type: string;
  In: any;
  Out: any;
}) {
    /* static type check only */
}

checkCallType({} as Call);
