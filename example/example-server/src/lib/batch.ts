import { Bar } from 'cli-progress'
import { LogService, parseLogObject } from './log.service'

const SampleCall = {
  CallType: 'Query',
  Type: 'AttemptGetProfile',
  In: {
    Timestamp: Date.now(),
    token: new Array(32).fill(0).join(''),
  },
}
const SampleKey = LogService.makeKey({
  timestamp: Date.now(),
  acc: 0,
  suffix: SampleCall.CallType,
})

// [key, content]
type batch<T> = Array<[string, T | batch<T> | null]>

const EmptyBatchSize = 2
const MaxBatchSize = 8 * 1024 * 1024
const MinItemSize =
  calcBatchItemSize(SampleKey, JSON.stringify(SampleCall).length) + 32

const BatchSuffix = 'Batch'
export const BatchSuffixPattern = LogService.keySeparator + BatchSuffix

const KeysSuffix = 'Keys'

const BatchKeysSuffix = BatchSuffix + KeysSuffix
export const BatchKeysSuffixPattern = LogService.keySeparator + BatchKeysSuffix

function createBar(name: string) {
  return new Bar({
    format:
      name + ' progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
  })
}

// `["key", content],`
function calcBatchItemSize(key: string, binSize: number) {
  return (
    2 + // array brackets
    2 + // key string quotes
    key.length +
    1 + // array comma
    binSize +
    1
  ) // tailing comma
}

export function batchCalls<T>(log: LogService) {
  console.log('batchCalls')
  const keys = log.getKeysSync()
  const keySet = new Set(keys)

  let batch: batch<T> = []
  let batchKeys: string[] = []
  let size = EmptyBatchSize

  function flush(): void {
    saveBatch()
    batch = []
    batchKeys = []
    size = EmptyBatchSize
  }

  function saveBatch(): void {
    if (batchKeys.length === 0) {
      return // skip empty batch
    }
    if (batchKeys.length === 1 && batchKeys[0].endsWith(BatchSuffixPattern)) {
      return // skip nested narrow snapshot
    }
    const ss = batchKeys[0].split(LogService.keySeparator)
    const timestamp = +ss[0]
    const acc = +ss[1]
    const batchKey = LogService.makeKey({
      timestamp,
      acc,
      suffix: BatchSuffix,
    })
    const batchKeysKey = batchKey + KeysSuffix
    if (keySet.has(batchKeysKey)) {
      log.removeObjectSync(batchKeysKey)
    }
    const { newBatch, newBatchKeys } = flattenBatch(batch)
    batch = [] // allow gc earlier
    log.storeObjectSync(newBatch, batchKey)
    log.storeObjectSync(newBatchKeys, batchKeysKey)
    keySet.add(batchKeysKey)
    for (const key of batchKeys) {
      if (key !== batchKey) {
        log.removeObjectSync(key)
      }
    }
  }

  function ensureBufferHasCapacity(objectSize: number) {
    if (size >= MaxBatchSize || size + objectSize >= MaxBatchSize) {
      flush()
    }
  }

  const contentKeys = keys.filter(key => !key.endsWith(BatchKeysSuffixPattern))
  const bar = createBar('batchCalls')
  bar.start(contentKeys.length, 0)
  for (const key of contentKeys) {
    const binSize = log.getBinSizeSync(key)
    const objectSize = calcBatchItemSize(key, binSize)
    if (objectSize + MinItemSize >= MaxBatchSize) {
      flush()
      bar.increment(1)
      continue
    }
    // this object can be patched into batch
    ensureBufferHasCapacity(objectSize)
    const content = log.getObjectSync<T>(key)
    size += objectSize
    batch.push([key, content])
    batchKeys.push(key)
    bar.increment(1)
  }
  flush()
  bar.stop()
}

export type BatchYield<T> = {
  key: string
  isFromBatch: boolean
  content: T | null
  estimateTotal: number
}

export function* iterateBatch<T>(log: LogService): Generator<BatchYield<T>> {
  const keys = log.getKeysSync()
  let estimateTotal = keys.length

  function* iterateBatch(batch: batch<T>): Generator<BatchYield<T>> {
    for (const [key, content] of batch) {
      yield* iterate({ key, content, isFromBatch: true })
    }
  }

  function* iterate({
    key,
    content,
    isFromBatch,
  }: {
    key: string
    content: T | batch<T> | null
    isFromBatch: boolean
  }): Generator<BatchYield<T>> {
    if (key.endsWith(BatchSuffixPattern)) {
      estimateTotal--
      if (!content) {
        return // skip null batch
      }
      const batch = content as batch<T>
      estimateTotal += batch.length
      yield* iterateBatch(batch)
    } else {
      yield {
        key,
        content: content as T,
        isFromBatch,
        estimateTotal,
      }
    }
  }

  for (const key of keys) {
    if (key.endsWith(BatchKeysSuffixPattern)) {
      estimateTotal--
      continue
    }
    const content = log.getObjectSync<T | batch<T>>(key)
    yield* iterate({ key, content, isFromBatch: false })
  }
}

export type BatchKeyYield = {
  key: string
  isFromBatch: boolean
  estimateTotal: number
}

export function* iterateBatchKeys(log: LogService): Generator<BatchKeyYield> {
  const keys: string[] = log.getKeysSync()
  const keySet: Set<string> = new Set(keys)
  let estimateTotal = keys.length

  function* iterateBatchKey(batchKey: string): Generator<BatchKeyYield> {
    const batchKeysKey = batchKey + KeysSuffix
    if (keySet.has(batchKeysKey)) {
      const keys = log.getObjectSync<string[]>(batchKeysKey)
      if (keys) {
        yield* iterateBatchKeys(keys)
        return
      }
      // empty keys
      log.removeObjectSync(batchKeysKey)
    }
    const batch = log.getObjectSync<batch<any>>(batchKey)!
    if (!batch) {
      return
    }
    const keys: string[] = []
    for (const entry of iterateBatch(batch)) {
      yield entry
      keys.push(entry.key)
    }
    log.storeObjectSync(keys, batchKeysKey)
    keySet.add(batchKeysKey)
  }

  function* iterateBatchKeys(keys: string[]): Generator<BatchKeyYield> {
    estimateTotal += keys.length
    for (const key of keys) {
      yield { key, estimateTotal, isFromBatch: true }
    }
  }

  function* iterateBatch(batch: batch<any>): Generator<BatchKeyYield> {
    estimateTotal += batch.length
    for (const [key, content] of batch) {
      if (key.endsWith(BatchSuffixPattern)) {
        yield* iterateBatch(content)
        continue
      }
      yield { key, estimateTotal, isFromBatch: true }
    }
  }

  for (const key of keys) {
    if (key.endsWith(BatchKeysSuffixPattern)) {
      estimateTotal--
      continue
    }
    if (key.endsWith(BatchSuffixPattern)) {
      estimateTotal--
      yield* iterateBatchKey(key)
      continue
    }
    yield { key, estimateTotal, isFromBatch: false }
  }
}

/**
 * return number of payload objects
 * */
export function countBatch(log: LogService): number {
  let acc = 0
  const keys: string[] = log.getKeysSync()
  const keySet: Set<string> = new Set(keys)

  function countBatchKey(batchKey: string) {
    const batchKeysKey = batchKey + KeysSuffix
    if (keySet.has(batchKeysKey)) {
      const keys = log.getObjectSync<string[]>(batchKeysKey)
      if (keys) {
        acc += keys.length
        return
      }
      // empty keys
      log.removeObjectSync(batchKeysKey)
    }
    const batch = log.getObjectSync<batch<any>>(batchKey)
    if (!batch) {
      return // skip empty batch
    }
    const keys: string[] = []
    walkInBatch(batch, key => keys.push(key))
    log.storeObjectSync(keys, batchKeysKey)
    acc += keys.length
  }

  for (const key of keys) {
    if (key.endsWith(BatchKeysSuffixPattern)) {
      continue
    }
    if (key.endsWith(BatchSuffixPattern)) {
      countBatchKey(key)
      continue
    }
    acc++
  }

  return acc
}

export function deduplicateBatch(log: LogService) {
  console.log('deduplicateBatch')

  let bar = createBar('scan keys')
  bar.start(0, 0)
  const standaloneKeys = new Set<string>()
  const batchedKeys = new Set<string>()
  for (const { key, isFromBatch, estimateTotal } of iterateBatchKeys(log)) {
    bar.setTotal(estimateTotal)
    ; (isFromBatch ? batchedKeys : standaloneKeys).add(key)
    bar.increment(1)
  }
  bar.stop()

  bar = createBar('delete duplicated keys')
  bar.start(standaloneKeys.size, 0)
  let deleted = 0
  for (const key of standaloneKeys) {
    if (batchedKeys.has(key)) {
      log.removeObjectSync(key)
      deleted++
    }
    bar.increment(1)
  }
  bar.stop()
  console.log('deleted', deleted, 'deduplicated keys')
}

export function getBatchKeysSync(log: LogService) {
  return log.getKeysSync().filter(key => key.endsWith(BatchSuffixPattern))
}

export function expandBatch<T>(log: LogService) {
  console.log('expandBatch')
  const keys = getBatchKeysSync(log)

  let totalSize = 0
  let bar = createBar('scan-files-size')
  bar.start(keys.length, 0)
  for (const key of keys) {
    totalSize += log.getBinSizeSync(key)
    bar.increment(1)
  }
  bar.stop()

  bar = createBar('expand-batch')
  bar.start(totalSize, 0)
  for (const key of keys) {
    const bin = log.getBinSync(key)
    if (bin === null) {
      continue
    }
    const batch = parseLogObject<batch<T>>(bin.toString())
    if (batch) {
      walkInBatch(batch, (key, content) => log.storeObjectSync(content, key))
    }
    bar.increment(bin.length)
    log.removeObjectSync(key)
  }
  bar.stop()
}

function flattenBatch<T>(batch: batch<T>) {
  const newBatch: batch<T> = []
  const newBatchKeys: string[] = []

  walkInBatch(batch, (key, content) => {
    newBatch.push([key, content])
    newBatchKeys.push(key)
  })
  return { newBatch, newBatchKeys }
}

export function walkInBatch<T>(
  batch: batch<T>,
  each: (key: string, content: T) => void,
) {
  batch.forEach(([key, content]) => {
    if (key.endsWith(BatchSuffixPattern)) {
      walkInBatch(content as batch<T>, each)
    } else {
      each(key, content as T)
    }
  })
}
