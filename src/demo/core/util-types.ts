/**
 * positive integer
 * */
export type pos_int = number;

export type id = string | number;
export type JsonPrimitive = string | number | null;

export interface JsonObject {
  [key: string]: JsonValue
}

export interface JsonArray {
  readonly length: number

  [key: number]: JsonValue
}

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
