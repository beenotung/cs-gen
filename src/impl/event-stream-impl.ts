import { EventStream } from '../event-store';

export class EventStreamImpl<T> implements EventStream<T> {
  cb: (t: T) => void = () => {};

  emit(t: T) {
    this.cb(t);
  }

  onData(f: (t: T) => void) {
    const cb = this.cb;
    this.cb = t => {
      cb(t);
      f(t);
    };
  }
}
