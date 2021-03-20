import { Injectable } from '@nestjs/common'
import { JSONStorage } from 'node-localstorage'

function patchFS() {
  let fs = require('fs')
  let gfs = require('graceful-fs')
  gfs.gracefulify(fs)
}

@Injectable()
export class LogService {
  static readonly keySeparator = '-'

  static makeKey(args: {
    timestamp: number
    acc: number
    suffix?: string
  }): string {
    let key = args.timestamp + this.keySeparator + args.acc
    if (args.suffix) {
      key += this.keySeparator + args.suffix
    }
    return key
  }

  storage = new JSONStorage('./data')
  private now?: number
  private acc?: number

  constructor() {
    patchFS()
  }

  nextKey(suffix?: string): string {
    const now = Date.now()
    if (this.now === now) {
      this.acc!++
    } else {
      this.now = now
      this.acc = 0
    }
    return LogService.makeKey({
      timestamp: now,
      acc: this.acc!,
      suffix,
    })
  }

  storeObjectSync(key: string, value: any) {
    this.storage.setItem(key, value)
  }

  getObjectSync<T>(key: string): T | null {
    return this.storage.getItem(key)
  }

  getKeysSync(): string[] {
    let n = this.storage.length
    let keys: string[] = []
    for (let i = 0; i < n; i++) {
      keys.push(this.storage.key(i))
    }
    return keys
  }
}
