export interface SequenceGeneratorConfig {
  step: number
  offset: number
}

export class SequenceGenerator {
  current: number;

  constructor(public config: SequenceGeneratorConfig) {
    this.current = config.offset;
  }

  /**
   * no side-effect
   * */
  getCurrent(): number {
    return this.current;
  }

  /**
   * no side-effect
   * */
  getNext(): number {
    return this.current + this.config.step;
  }

  /**
   * apply side-effect
   * */
  getAndSetNext(): number {
    return this.current += this.config.step;
  }

  /**
   * apply side-effect
   * */
  compareAndSetNext(next: number): boolean {
    if (next === this.current + this.config.step) {
      this.current = next;
      return true;
    } else {
      return false;
    }
  }
}
