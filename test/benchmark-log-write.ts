import { iterateBatch } from '../src/lib/batch'
import { logService } from '../scripts/utils'
import { Call } from '../src/domain/types'
import { mkdirSync, rmdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import Level from '@beenotung/level-ts'
import DB from 'better-sqlite3-helper'
import { toExportMode, toSafeMode } from 'better-sqlite3-schema'
import { createSpeedTimer } from '@beenotung/tslib/speed-timer'
import { catchMain } from '@beenotung/tslib/node'

type Key = string
let calls: [Key, Call][] = []

function loadData(tick: Function) {
  for (let { key, content } of iterateBatch<Call>(logService)) {
    if (content) {
      calls.push([key, content])
    }
    tick()
    if (calls.length >= 10 * 1000) {
      break
    }
  }
}

let dataDir = join('data', 'benchmark')

function prepareDataDir() {
  mkdirSync(dataDir, { recursive: true })
  rmdirSync(fsDir, { recursive: true })
  mkdirSync(fsDir, { recursive: true })
  rmdirSync(leveldbDir, { recursive: true })
  rmdirSync(sqliteFile, { recursive: true })
}

let fsDir = join(dataDir, 'fs')

/** 390 Write-Per-Second **/
function writeFs(tick: Function) {
  calls.forEach(([key, call]) => {
    let file = join(fsDir, key)
    let content = JSON.stringify(call)
    writeFileSync(file, content)
    tick()
  })
}

let leveldbDir = join(dataDir, 'leveldb')

/** 2600 Write-Per-Second **/
async function writeLevelDB(tick: Function) {
  let db = new Level(leveldbDir)
  for (let [key, call] of calls) {
    await db.put(key, call as object)
    tick()
  }
}

let sqliteFile = join(dataDir, 'sqlite.db')

/**
 * Cache Size: 8M
 *
 * Safe Mode:
 * PRAGMA journal_mode = WAL
 * PRAGMA synchronous = ON
 *
 * Export Mode:
 * PRAGMA synchronous = OFF
 * PRAGMA journal_mode = MEMORY
 *
 * 3100 Write-Per-Second in Safe Mode
 * 4430 Write-Per-Second in Export Mode
 * */
function writeSqlite(tick: Function) {
  let db = DB({ path: sqliteFile, migrate: false })
  toExportMode(db, 8 * 1000 * 1000)
  // toSafeMode(db)
  db.exec(
    `
      create table if not exists log
      (
        key  text,
        call json
      )`,
  )
  calls.forEach(([key, call]) => {
    db.insert('log', { key, call: JSON.stringify(call) })
    tick()
  })
  toSafeMode(db)
}

async function test(fn: Function) {
  let name = fn.name
  console.log(`== ${name} ==`)
  let timer = createSpeedTimer(name)
  timer.start()
  let i = 0
  let n = calls.length
  let reportInterval = Math.floor(n / 10)
  await fn(() => {
    timer.tick()
    i++
    if (reportInterval && i % reportInterval === 0) {
      timer.report()
    }
  })
  timer.tick()
  timer.report()
  let { passedTime, ticks } = timer.stats()
  let tps = ticks / (passedTime / 1000)
  console.log(`tps:`, tps.toFixed(2))
  console.log('='.repeat(name.length + 5))
}

async function main() {
  await test(prepareDataDir)
  await test(loadData)
  await test(writeFs)
  await test(writeLevelDB)
  await test(writeSqlite)
}

catchMain(main())
