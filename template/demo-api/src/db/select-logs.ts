import { db } from '../../config/db'
import { getStrVal, getJsonVal } from './str-helpers'
import type { IntLike } from 'integer'
import type * as t from '../types'

const select_create_user = db.prepare(`
  select *
  from create_user
  where log_id = ?
  limit 1
`)

export function selectCreateUser(log_id: IntLike): t.CreateUser['in'] {
  const row = select_create_user.get(log_id)
  row.username = getStrVal(row.username)
  row.email = getStrVal(row.email)
  return row
}

const select_change_username = db.prepare(`
  select *
  from change_username
  where log_id = ?
  limit 1
`)

export function selectChangeUsername(log_id: IntLike): t.ChangeUsername['in'] {
  const row = select_change_username.get(log_id)
  row.from_username = getStrVal(row.from_username)
  row.to_username = getStrVal(row.to_username)
  return row
}

const select_check_username_exist = db.prepare(`
  select *
  from check_username_exist
  where log_id = ?
  limit 1
`)

export function selectCheckUsernameExist(log_id: IntLike): t.CheckUsernameExist['in'] {
  const row = select_check_username_exist.get(log_id)
  row.username = getStrVal(row.username)
  return row
}

const select_delete_username = db.prepare(`
  select *
  from delete_username
  where log_id = ?
  limit 1
`)

export function selectDeleteUsername(log_id: IntLike): t.DeleteUsername['in'] {
  const row = select_delete_username.get(log_id)
  row.username = getStrVal(row.username)
  return row
}

const select_log_browser_stats = db.prepare(`
  select *
  from log_browser_stats
  where log_id = ?
  limit 1
`)

export function selectLogBrowserStats(log_id: IntLike): t.LogBrowserStats['in'] {
  const row = select_log_browser_stats.get(log_id)
  row.userAgent = getStrVal(row.userAgent)
  row.language = getStrVal(row.language)
  row.languages = getJsonVal(row.languages)
  row.platform = getStrVal(row.platform)
  row.vendor = getStrVal(row.vendor)
  row.connection = getJsonVal(row.connection)
  row.cookieEnabled = row.cookieEnabled === null || row.cookieEnabled === undefined ? null : !!row.cookieEnabled
  return row
}

const select_cancel_subscribe = db.prepare(`
  select *
  from cancel_subscribe
  where log_id = ?
  limit 1
`)

export function selectCancelSubscribe(log_id: IntLike): t.CancelSubscribe['in'] {
  const row = select_cancel_subscribe.get(log_id)
  row.feed_id = getStrVal(row.feed_id)
  return row
}
