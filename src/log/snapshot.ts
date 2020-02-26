import { Bar } from 'cli-progress';
import { LogService } from './log.service';
// [key, content]
export type batch = Array<[string, string]>;
export type Snapshot = {
  key: string;
  size: number;
  batch: batch;
};
const SnapshotBatchSize = 8 * 1024 * 1024;
const suffix = 'Snapshot';
const suffixPattern = LogService.keySeparator + suffix;

export function makeSnapshot(log: LogService) {
  const bar = new Bar({
    format:
      'makeSnapshot progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
  });
  const keys = log.getKeysSync();
  bar.start(keys.length, 0);
  let size = 0;
  let timestamp: number;
  let acc: number;
  let batch: batch = [];
  let batchKeys: string[] = [];

  function flush() {
    if (batch.length === 0) {
      return;
    }
    // skip nested narrow snapshot
    if (batch.length === 1 && batch[0][0].endsWith(suffixPattern)) {
      batch = [];
      batchKeys = [];
      size = 0;
      return;
    }
    const key = LogService.makeKey({
      timestamp,
      acc,
      suffix,
    });
    log.storeObjectSync(batch, key);
    batch = [];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < batchKeys.length; i++) {
      const key = batchKeys[i];
      log.removeObjectSync(key);
      bar.increment(1);
    }
    batchKeys = [];
    size = 0;
  }

  for (const key of keys) {
    const bin = log.getBinSync(key);
    const objectSize = key.length + bin.length + `['','']`.length;
    if (size >= SnapshotBatchSize || size + objectSize >= SnapshotBatchSize) {
      flush();
    }
    if (objectSize >= SnapshotBatchSize) {
      bar.increment(1);
      continue;
    }
    // this object can be patched into snapshot
    if (batch.length === 0) {
      // first object, extract timestamp and acc for snapshot filename
      const ss = key.split(LogService.keySeparator);
      timestamp = +ss[0];
      acc = +ss[1];
    }
    size += objectSize;
    batch.push([key, bin.toString()]);
    batchKeys.push(key);
  }
  flush();
  bar.stop();
}

export type SnapshotYield<T> = {
  key: string;
  content: () => T | null;
  estimateTotal: number;
};

export function* iterateSnapshot<T>(
  log: LogService,
): Generator<SnapshotYield<T>> {
  const keys = log.getKeysSync();
  let estimateTotal = keys.length;

  function* iterateSnapshotHelper<T>(
    batch: batch,
  ): Generator<SnapshotYield<T>> {
    for (const [key, content] of batch) {
      if (!key.endsWith(suffixPattern)) {
        const res: SnapshotYield<T> = {
          key,
          content: () => JSON.parse(content),
          estimateTotal,
        };
        yield res;
        continue;
      }
      const batch2 = log.getObjectSync<batch>(key);
      if (batch2 === null) {
        continue;
      }
      estimateTotal += batch2.length;
      yield* iterateSnapshotHelper<T>(batch2);
    }
  }

  for (const key of keys) {
    if (!key.endsWith(suffixPattern)) {
      const res: SnapshotYield<T> = {
        key,
        content: () => log.getObjectSync(key),
        estimateTotal,
      };
      yield res;
      continue;
    }
    const batch = log.getObjectSync<batch>(key);
    if (batch === null) {
      continue;
    }
    estimateTotal += batch.length;
    yield* iterateSnapshotHelper(batch);
  }
}

function countSnapshotHelper(log: LogService, batch: batch): number {
  let count = 0;
  for (const [key, content] of batch) {
    if (!key.endsWith(suffixPattern)) {
      count++;
      continue;
    }
    // this is also snapshot, need recursion
    const batch2 = JSON.parse(content);
    if (batch2 === null) {
      continue;
    }
    count += countSnapshotHelper(log, batch2);
  }
  return count;
}

/**
 * return number of payload objects
 * */
export function countSnapshot(log: LogService): number {
  let count = 0;
  const keys = log.getKeysSync();
  for (const key of keys) {
    if (!key.endsWith(suffixPattern)) {
      count++;
      continue;
    }
    // this is snapshot, expand it
    const batch = log.getObjectSync<batch>(key);
    if (batch === null) {
      continue;
    }
    count += countSnapshotHelper(log, batch);
  }
  return count;
}

export function deduplicateSnapshot(log: LogService) {
  const batchedKeys = new Set<string>();
  const keys = log.getKeysSync();
  const bar = new Bar({
    format:
      'deduplicateSnapshot progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
  });
  bar.start(keys.length * 2, 0);
  for (const filename of keys) {
    if (filename.endsWith(suffixPattern)) {
      const batch = log.getObjectSync<batch>(filename);
      if (batch) {
        batch.forEach(([key]) => {
          if (key !== filename) {
            batchedKeys.add(key);
          }
        });
      }
    }
    bar.increment(1);
  }
  for (const key of keys) {
    if (batchedKeys.has(key)) {
      log.removeObjectSync(key);
    }
    bar.increment(1);
  }
  bar.stop();
}
