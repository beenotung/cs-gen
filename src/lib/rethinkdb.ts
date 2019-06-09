import * as r from 'rethinkdb';

export interface Expression<T> extends r.Expression<T> {
  /**
   * for filter, will be used as Expression<boolean>
   * for selector, will be used as projector
   */
  match(
    regexp: string,
  ):
    | Expression<{
        start: number;
        end: number;
        str: string;
        groups: Array<{
          start: number;
          end: number;
          str: string;
        }>;
      }>
    | Expression<boolean>;
}

export namespace Expression {
  export function cast<T>(e: r.Expression<T>): Expression<T> {
    return e as any;
  }
}
