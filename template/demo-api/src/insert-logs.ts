import { db } from '../config/db'
import { getStrId, getJsonId, insertLog } from './db-queries'
import type { IntLike } from 'integer'
import type {
  CallIn,
  CreateUser,
  ChangeUsername,
  CheckUsernameExist,
  DeleteUsername,
  LogBrowserStats,
  CancelSubscribe,
} from './types'

const insert_create_user = db.prepare(`
  insert into create_user
  ( log_id
  , username
  , email)
  values ( :log_id
         , :username
         , :email);`)

export function insertCreateUser(log_id: IntLike, callIn: CreateUser['in']) {
  return insert_create_user.run({
    log_id,
    username: getStrId(callIn.username),
    email: getStrId(callIn.email),
  })
}

const insert_change_username = db.prepare(`
  insert into change_username
  ( log_id
  , from_username
  , to_username)
  values ( :log_id
         , :from_username
         , :to_username);`)

export function insertChangeUsername(
  log_id: IntLike,
  callIn: ChangeUsername['in'],
) {
  return insert_change_username.run({
    log_id,
    from_username: getStrId(callIn.from_username),
    to_username: getStrId(callIn.to_username),
  })
}

const insert_check_username_exist = db.prepare(`
  insert into check_username_exist
  ( log_id
  , username)
  values ( :log_id
         , :username);`)

export function insertCheckUsernameExist(
  log_id: IntLike,
  callIn: CheckUsernameExist['in'],
) {
  return insert_check_username_exist.run({
    log_id,
    username: getStrId(callIn.username),
  })
}

const insert_delete_username = db.prepare(`
  insert into delete_username
  ( log_id
  , username)
  values ( :log_id
         , :username);`)

export function insertDeleteUsername(
  log_id: IntLike,
  callIn: DeleteUsername['in'],
) {
  return insert_delete_username.run({
    log_id,
    username: getStrId(callIn.username),
  })
}

const insert_log_browser_stats = db.prepare(`
  insert into log_browser_stats
  ( log_id
  , userAgent
  , language
  , languages
  , deviceMemory
  , hardwareConcurrency
  , maxTouchPoints
  , platform
  , vendor
  , connection
  , cookieEnabled)
  values ( :log_id
         , :userAgent
         , :language
         , :languages
         , :deviceMemory
         , :hardwareConcurrency
         , :maxTouchPoints
         , :platform
         , :vendor
         , :connection
         , :cookieEnabled);`)

export function insertLogBrowserStats(
  log_id: IntLike,
  callIn: LogBrowserStats['in'],
) {
  return insert_log_browser_stats.run({
    log_id,
    userAgent: getStrId(callIn.userAgent),
    language: getStrId(callIn.language),
    languages: getJsonId(callIn.languages),
    deviceMemory: callIn.deviceMemory,
    hardwareConcurrency: callIn.hardwareConcurrency,
    maxTouchPoints: callIn.maxTouchPoints,
    platform: getStrId(callIn.platform),
    vendor: getStrId(callIn.vendor),
    connection: getJsonId(callIn.connection),
    cookieEnabled:
      callIn.cookieEnabled === null || callIn.cookieEnabled === undefined
        ? null
        : callIn.cookieEnabled
        ? 1
        : 0,
  })
}

const insert_cancel_subscribe = db.prepare(`
  insert into cancel_subscribe
  ( log_id
  , feed_id)
  values ( :log_id
         , :feed_id);`)

export function insertCancelSubscribe(
  log_id: IntLike,
  callIn: CancelSubscribe['in'],
) {
  return insert_cancel_subscribe.run({
    log_id,
    feed_id: getStrId(callIn.feed_id),
  })
}

export function storeLog(timestamp: number, acc: number, call: CallIn) {
  const log_id = insertLog(timestamp, acc, call.id)
  switch (call.id) {
    case 1:
      insertCreateUser(log_id, call.in)
      break
    case 3:
      insertChangeUsername(log_id, call.in)
      break
    case 4:
      insertCheckUsernameExist(log_id, call.in)
      break
    case 5:
      insertDeleteUsername(log_id, call.in)
      break
    case 6:
      insertLogBrowserStats(log_id, call.in)
      break
    case 8:
      insertCancelSubscribe(log_id, call.in)
      break
    case 2:
    case 7:
      // skip insert body for empty input
      break
    default:
      throw new Error('unknown meta_id: ' + (call as any).id)
  }
}
