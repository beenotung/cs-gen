#!/usr/bin/env ts-node
import { CoreService } from '../src/core/core.service'
import { iterateBatch } from '../src/lib/batch'
import { logService } from './utils'
import { Call } from '../src/domain/types'
import { status } from '../src/core/status'

export async function loadSnapshot() {
  console.log('replaying calls')
  status.isReplay = true
  let coreService = new CoreService()
  for (let { content } of iterateBatch(logService)) {
    if (!content) {
      continue
    }
    const call = content as Call
    await coreService.Call(call)
  }
  console.log('replayed calls')
  return coreService
}

if (process.argv[1] === __filename) {
  loadSnapshot()
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
}
