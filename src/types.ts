export type CallType = 'Command' | 'Query' | 'Subscribe';

/**
 * for Command, Out is list of created events
 * for Query, Out is the one-time query result
 * for Subscribe, Out is an channel-id to listen / cancel the subscription
 * */
export interface Call<
  _CallType = CallType,
  Type extends string = string,
  In = any,
  Out = any
> {
  CallType: _CallType;
  Type: Type;
  In: In;
  Out: Out;
}

export type Result<T> = T | Promise<T>;

export interface ICommand {
  command_id: string;
  version: string;
  timestamp: number;
  command_type?: string;
}

export interface IEvent {
  aggregate_id: string;
  version: string;
  command_id: string;
  timestamp: number;
  event_type?: string;
}

export interface IQuery {
  query_type?: string;
}

export interface ISubscribe {
  subscribe_type?: string;
}

/*
type ExampleEvent = IEvent & {
  event_type: 'ExampleEvent';
  username: string;
};
*/
