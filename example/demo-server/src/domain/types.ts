export type CreateUser = {
  CallType: 'Command';
  Type: 'CreateUser',
  In: { UserId: string, UserName: string, Timestamp: number },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};
export type RenameUser = {
  CallType: 'Command';
  Type: 'RenameUser',
  In: { UserId: string, NewUsername: string, Timestamp: number },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};
export type CreateItem = {
  CallType: 'Command';
  Type: 'CreateItem',
  In: { ItemName: string, UserId: string, Timestamp: number },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};
export type BlockUser = {
  CallType: 'Command';
  Type: 'BlockUser',
  In: { UserId: string, Timestamp: number },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};

export type Command = CreateUser | RenameUser | CreateItem | BlockUser;

export type GetProfile = {
  CallType: 'Query';
  Type: 'GetProfile',
  In: { UserId: string, Timestamp: number },
  Out: { UserId: string, UserName: string },
};
export type GetUserList = {
  CallType: 'Query';
  Type: 'GetUserList',
  In: { Timestamp: number },
  Out: Array<{ UserId: string, UserName: string }>,
};

export type Query = GetProfile | GetUserList;

export type SubscribeItems = {
  CallType: 'Subscribe';
  Type: 'SubscribeItems',
  In: { Timestamp: number },
  Out: { id: string },
};

export type Subscribe = SubscribeItems;

export type Call = Command | Query | Subscribe;

function checkCallType(t: {
  CallType: 'Command' | 'Query' | 'Subscribe';
  Type: string;
  In: any;
  Out: any;
}) {
    /* static type check only */
}

checkCallType({} as Call);
