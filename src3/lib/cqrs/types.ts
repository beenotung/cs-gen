/**
 * types for cqrs
 * - command
 * - events
 * - query & response
 * */
export type id = string | number | { toString(): string };
export type typed_value<D = any, T = string> = { type: T } & { data: D };
export type typed_data<D = any, T = string> = { id: id } & typed_value<D, T>;

export type command<C = any, T = string> = typed_value<C, T>;
export type event<E = any, T = string> = typed_data<E, T>;
export type query<Q = any, T = string> = typed_value<Q, T>;
// export type response<R = any, T = string> = typed_data<R, T>;

/* return list of events if valid, */
/**
 * return list of events if valid
 * return error message if invalid
 * */
export type command_handler<c extends command, e extends event> = (command: c) => e[] | string;
export type query_handler<q extends query, response> = (query: q) => response;
