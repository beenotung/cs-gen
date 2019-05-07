export interface Call<Type extends string = string, In = any, Out = any> {
  Type: Type;
  In: In;
  Out: Out;
}

export type Result<T> = T | Promise<T>;
