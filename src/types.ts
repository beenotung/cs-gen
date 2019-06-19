export type CallType = 'Command' | 'Query' | 'Subscribe';

export type Call<Type extends string = string, In = any, Out = any> =
  | {
      CallType: 'Command' | 'Query';
      Type: Type;
      In: In;
      Out: Out;
    }
  | {
      CallType: 'Subscribe';
      Type: Type;
      In: In;
    };

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
