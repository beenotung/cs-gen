export interface Store<T> {
  store(t: T): Promise<void>

  getByType(type: string): Promise<T[]>

  subscribe(type: string, onEvent: (event: T) => void)
}
