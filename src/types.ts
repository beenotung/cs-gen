export type CallType = 'Command' | 'Query' | 'Mixed';

export interface Call<Type extends string = string, In = any, Out = any> {
  CallType: CallType;
  Type: Type;
  In: In;
  Out: Out;
}

export type Result<T> = T | Promise<T>;

export interface IEvent {
  aggregate_id: string;
  version: string;
  command_id: string;
  timestamp: number;
  event_type?: string;
}

/*
type ExampleEvent = IEvent & {
  event_type: 'ExampleEvent';
  username: string;
};
*/
