export interface RunnerOptions {
  continueWhenError?: boolean;
}

/**
 * like single thread scheduler/executor for async tasks
 * */
export class Runner {
  last = Promise.resolve();

  constructor(public options: RunnerOptions = {}) {}

  queue<T>(f: () => T | Promise<T>): Promise<T> {
    return new Promise<T>(
      (resolve, reject) =>
        (this.last = this.last.then(() =>
          Runner.run(f)
            .then(resolve)
            .catch(err => {
              reject(err);
              if (this.options.continueWhenError) {
                return void 0;
              } else {
                return Promise.reject(err);
              }
            }),
        )),
    );
  }

  static run<T>(f: () => T | Promise<T>): Promise<T> {
    try {
      return Promise.resolve(f());
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
