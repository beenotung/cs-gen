import { Bar } from 'cli-progress';
import { LogService } from './log.service';

const MaxBatchSize = 8 * 1024 * 1024;
const Suffix = 'Batch';
const SuffixPattern = LogService.keySeparator + Suffix;

// [key, content]
type batch<T> = Array<[string, T | batch<T>]>;

function createBar(name: string) {
  return new Bar({
    format:
      name + ' progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
  });
}

const EmptyBatchSize = 2;

export function batchCalls<T>(log: LogService) {
  const bar = createBar('batchCalls');
  const keys = log.getKeysSync();
  bar.start(keys.length, 0);
  let timestamp: number;
  let acc: number;
  let batch: batch<T> = [];
  let batchKeys: string[] = [];
  let size = EmptyBatchSize;

  function reset(): void {
    batch = [];
    batchKeys = [];
    size = EmptyBatchSize;
  }

  function flush(): void {
    if (batchKeys.length === 0) {
      return reset();
    }
    // skip nested narrow snapshot
    if (batchKeys.length === 1 && batchKeys[0].endsWith(SuffixPattern)) {
      return reset();
    }
    const batchKey = LogService.makeKey({
      timestamp,
      acc,
      suffix: Suffix,
    });
    log.storeObjectSync(batch, batchKey);
    batch = []; // allow gc earlier
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < batchKeys.length; i++) {
      const contentKey = batchKeys[i];
      // do not delete the snapshot in case of appending
      if (contentKey !== batchKey) {
        log.removeObjectSync(contentKey);
      }
      bar.increment(1);
    }
    return reset();
  }

  function ensureBufferHasCapacity(objectSize: number) {
    if (size >= MaxBatchSize || size + objectSize >= MaxBatchSize) {
      flush();
    }
  }

  for (const key of keys) {
    const bin = log.getBinSync(key);
    const objectSize =
      2 + // array bracket
      key.length +
      2 + // string quote
      1 + // array comma
      bin.length +
      1; // tailing comma
    if (objectSize >= MaxBatchSize) {
      flush();
      bar.increment(1);
      continue;
    }
    ensureBufferHasCapacity(objectSize);
    // this object can be patched into snapshot
    if (batchKeys.length === 0) {
      // first object, extract timestamp and acc for snapshot filename
      const ss = key.split(LogService.keySeparator);
      timestamp = +ss[0];
      acc = +ss[1];
    }
    batchKeys.push(key);
    batch.push([key, JSON.parse(bin.toString())]);
    size += objectSize;
  }
  flush();
  bar.stop();
}

export type BatchYield<T> = {
  key: string;
  isFromBatch: boolean;
  content: T | null;
  estimateTotal: number;
};

export function* iterateBatch<T>(log: LogService): Generator<BatchYield<T>> {
  const keys = log.getKeysSync();
  let estimateTotal = keys.length;

  function* iterateBatch(batch: batch<T>): Generator<BatchYield<T>> {
    for (const [key, content] of batch) {
      yield* iterate({ key, content, isFromBatch: true });
    }
  }

  function* iterate({
    key,
    content,
    isFromBatch,
  }: {
    key: string;
    content: T | batch<T> | null;
    isFromBatch: boolean;
  }): Generator<BatchYield<T>> {
    if (key.endsWith(SuffixPattern)) {
      estimateTotal--;
      if (!content) {
        return; // skip null batch
      }
      const batch = content as batch<T>;
      estimateTotal += batch.length;
      yield* iterateBatch(batch);
    } else {
      yield {
        key,
        content: content as T,
        isFromBatch,
        estimateTotal,
      };
    }
  }

  for (const key of keys) {
    const content = log.getObjectSync<T | batch<T>>(key);
    yield* iterate({ key, content, isFromBatch: false });
  }
}

function countBatchHelper<T>(
  key: string,
  content: T | batch<T> | null,
): number {
  if (!key.endsWith(SuffixPattern)) {
    return 1;
  }
  if (content === null) {
    return 0;
  }
  const batch = content as batch<T>;
  let acc = 0;
  for (const [key, content] of batch) {
    acc += countBatchHelper(key, content);
  }
  return acc;
}

/**
 * return number of payload objects
 * */
export function countBatch(log: LogService): number {
  let acc = 0;
  const keys = log.getKeysSync();
  for (const key of keys) {
    const content = log.getObjectSync(key);
    acc += countBatchHelper(key, content);
  }
  return acc;
}

export function deduplicateBatch(log: LogService) {
  console.log('deduplicateBatch');

  let bar = createBar('scan keys');
  bar.start(0, 0);
  const standaloneKeys = new Set<string>();
  const batchedKeys = new Set<string>();
  for (const { key, isFromBatch, estimateTotal } of iterateBatch(log)) {
    bar.setTotal(estimateTotal);
    (isFromBatch ? batchedKeys : standaloneKeys).add(key);
    bar.increment(1);
  }
  bar.stop();

  bar = createBar('delete duplicate keys');
  bar.start(standaloneKeys.size, 0);
  for (const key of standaloneKeys) {
    if (batchedKeys.has(key)) {
      log.removeObjectSync(key);
    }
    bar.increment(1);
  }
  bar.stop();
}

export function expandBatch<T>(log: LogService) {
  const keys = log.getKeysSync().filter(key => key.endsWith(SuffixPattern));

  let totalSize = 0;
  let bar = createBar('scan files size');
  bar.start(keys.length, 0);
  for (const key of keys) {
    totalSize += log.getBinSizeSync(key);
    bar.increment(1);
  }
  bar.stop();

  bar = createBar('expandBatch');
  bar.start(totalSize, 0);
  for (const key of keys) {
    const bin = log.getBinSync(key);
    if (bin === null) {
      continue;
    }
    const batch = JSON.parse(bin.toString()) as batch<T>;
    for (const [key, value] of batch) {
      log.storeObjectSync(value, key);
    }
    bar.increment(bin.length);
    log.removeObjectSync(key);
  }
  bar.stop();
}
