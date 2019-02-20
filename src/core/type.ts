export type int = number;
export type pos_int = int;
export type timestamp = number;

export type JsonPrimitive = string | number;

export interface JsonArray extends Array<JsonPrimitive | JsonArray> {
}

export interface JsonObject {
  [key: string]: JsonValue
}

export type JsonValue = JsonPrimitive | JsonArray | JsonObject;
export type ID = string | pos_int;
