export interface Store<T> {
  store(t: T): Promise<void>

  subscribe(type: string, onEvent: (event: T) => void)
}
