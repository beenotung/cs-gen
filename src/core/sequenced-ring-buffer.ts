export class IndexOutOfRangeError extends Error {
  /**
   * @param index: the index attempted to access
   * @param lowerBound: inclusive lower bound of valid value
   * @param upperBound: exclusive upper bound of valid value
   * @param message: for the super class
   * */
  constructor(
    index: number,
    lowerBound: number,
    upperBound: number,
    message?: string,
  ) {
    super(message);
  }
}

export class BufferOutOfSpaceError extends Error {
  /**
   * @param allocate: number of space attempted to acquire
   * @param used: amount of space already used
   * @param capacity: maximum space available
   * @param message: for the super class
   * */
  constructor(
    allocate: number,
    used: number,
    capacity: number,
    message?: string,
  ) {
    super(message);
  }
}

export class BufferEmptyError extends Error {}

export interface SequenceData<T> {
  sequence: number;
  value: T;
}

export class SequencedRingBuffer<T> {
  readonly capacity: number;
  size = 0;
  private readonly entities: Array<SequenceData<T>> = new Array(this.capacity);
  private putPos = 0;
  private getPos = 0;
  private sequence: number;

  constructor(capacity: number, initialSequence = 0) {
    this.capacity = capacity;
    this.sequence = initialSequence;
  }

  ensureHasCapacity(allocate: number) {
    if (this.size + allocate > this.capacity) {
      throw new BufferOutOfSpaceError(allocate, this.size, this.capacity);
    }
  }

  enqueue(value: T): number {
    this.ensureHasCapacity(1);
    this.entities[this.putPos] = { value, sequence: this.sequence };
    this.putPos = (this.putPos + 1) % this.capacity;
    this.size++;
    return this.sequence++;
  }

  dequeue(): SequenceData<T> {
    if (this.size === 0) {
      throw new BufferEmptyError();
    }
    const value = this.entities[this.getPos];
    delete this.entities[this.getPos];
    this.getPos = (this.getPos + 1) % this.capacity;
    this.size--;
    return value;
  }

  toArray(): Array<SequenceData<T>> {
    const result = new Array<SequenceData<T>>(this.size);
    for (let i = 0; i != this.size; i++) {
      result[i] = this.entities[(this.getPos + i) % this.capacity];
    }
    return result;
  }
}
