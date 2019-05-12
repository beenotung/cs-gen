export type CallType = 'Command' | 'Query' | 'Mixed';

export interface Call<Type extends string = string, In = any, Out = any> {
  CallType: CallType;
  Type: Type;
  In: In;
  Out: Out;
}

export type Result<T> = T | Promise<T>;
