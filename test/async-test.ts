let N = 2_297_524;

async function runPromiseAsync(x: number) {
  return x + 1;
}

async function testPromiseAwait() {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    acc = await runPromiseAsync(acc);
  }
  console.log({ promiseAwait: acc });
}

function runPromiseResolve(x: number) {
  return Promise.resolve(x + 1);
}

function testPromiseThen() {
  let acc = 0;
  let p: Promise<any> = Promise.resolve(acc);
  for (let i = 0; i < N; i++) {
    p = p.then(acc => runPromiseResolve(acc));
  }
  return p.then(acc => {
    console.log({ promiseThen: acc });
  });
}

type Callback<T> = (err: any, res: T) => void;

function runCallback(x: number, cb: Callback<number>) {
  // setImmediate(()=>{
  cb(null, x + 1);
  // })
}

function testCallbackRecursive(cb: Callback<void>) {
  function loop(i: number, acc: number) {
    if (i < N) {
      runCallback(acc, (err, acc) => loop(i + 1, acc));
    } else {
      console.log({ callbackRecursive: acc });
      cb(null);
    }
  }

  loop(0, 0);
}

interface FakePromise<T> {
  then(cb: (res: T) => FakePromise<T>): FakePromise<T>;
}

function runFakePromise(x: number): FakePromise<number> {
  return {
    then: (cb: (res: number) => FakePromise<number>) => {
      return cb(x + 1);
    },
    catch: (cb: (err: any) => FakePromise<any>) => {
      return null as any;
    },
  } as any;
}

function makeFakePromise<T>(res: T): FakePromise<T> {
  return {
    then: (cb: (res: T) => FakePromise<T>) => {
      return cb(res);
    },
  };
}

function testFakePromise() {
  let acc = 0;
  let p = runFakePromise(acc);
  for (let i = 0; i < N; i++) {
    p = p.then(acc => runFakePromise(acc));
  }
  return p.then(acc => {
    console.log({ fakePromise: acc });
    return makeFakePromise(null as any);
  });
}

function testCallbackStack(cb: Callback<void>) {
  let stack: any[] = [];
  let stackTop = 0;

  function call(fn: (cb: Callback<any>) => void) {}

  let acc = 0;
  for (let i = 0; i < N; i++) {
    runCallback(acc, (err, res) => {
      acc = res;
    });
  }
  console.log({ callbackStack: acc });
  cb(null);
}

function testAll() {
  console.time('promiseAwait');
  testPromiseAwait().then(() => {
    console.timeEnd('promiseAwait');
    console.time('promiseThen');
    testPromiseThen().then(() => {
      console.timeEnd('promiseThen');
      console.time('callbackStack');
      testCallbackStack(() => {
        console.timeEnd('callbackStack');

        console.time('fakePromise');
        testFakePromise().then(() => {
          console.timeEnd('fakePromise');
          return makeFakePromise(null as any);
        });

        //   // console.time('callbackRecursive');
        //   // testCallbackRecursive(() => {
        //   //   console.timeEnd('callbackRecursive');
        //   // });
      });
    });
  });
}

testAll();
