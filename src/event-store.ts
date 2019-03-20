export interface Event {
  aggregate_type: string
  aggregate_id: string
  seq: number
  event: object | string | Buffer | Blob | any
}

export function eventToId(event: Event): string {
  return [
    event.aggregate_type,
    event.aggregate_id,
    event.seq,
  ].join(':');
}

export type EventSelector = Partial<Pick<Event, 'aggregate_type' | 'aggregate_id'>>

export interface EventStream<T = any> {
  emit(t: T)

  onData(f: (t: T) => void)
}

export interface EventStore {
  store(event: Event): Promise<void>

  storeAll(events: Event[]): Promise<void>

  getAll(): EventStream<Event>

  getAllBy(selector: EventSelector): EventStream<Event>
}
