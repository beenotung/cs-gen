import type { Context } from './engine-helpers'
import type { Result } from './types'
import type * as t from './types'

export interface ILogicalProcessor {
  createUser(input: t.CreateUser['in'], context: Context): Result<t.CreateUser>
  getAllUsernames(input: t.GetAllUsernames['in'], context: Context): Result<t.GetAllUsernames>
  changeUsername(input: t.ChangeUsername['in'], context: Context): Result<t.ChangeUsername>
  checkUsernameExist(input: t.CheckUsernameExist['in'], context: Context): Result<t.CheckUsernameExist>
  deleteUsername(input: t.DeleteUsername['in'], context: Context): Result<t.DeleteUsername>
  logBrowserStats(input: t.LogBrowserStats['in'], context: Context): Result<t.LogBrowserStats>
  subscribeUsername(input: t.SubscribeUsername['in'], context: Context): Result<t.SubscribeUsername>
  cancelSubscribe(input: t.CancelSubscribe['in'], context: Context): Result<t.CancelSubscribe>
}
