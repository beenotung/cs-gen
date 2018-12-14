export type id = string | number | { toString(): string }

export interface DataValue<T> {
  type: string
  payload: T
}

export interface DataObject<T> extends DataValue<T> {
  id: id
}

export interface Command<C>extends DataObject<C> {
  session?
}

export interface Event<E>extends DataObject<E> {
  seq: number
}

export interface Query<Q, R> extends DataValue<Q> {
  session?
}

export interface AggregateObject<T>extends DataValue<T> {

}
