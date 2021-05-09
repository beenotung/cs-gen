import { ILogicalProcessor } from './logic-processor-interface'
import { ok } from '../types'
import type { Result } from '../types'
import type * as t from '../types'
import type { Context } from './engine-helpers'

class User {
  constructor(public profile: { username: string; email: string }, public create_at: number) {}
}

export class LogicalProcessor implements Partial<ILogicalProcessor> {
  users = new Map<string, User>()

  createUser(input: t.CreateUser['in'], context: Context): Result<t.CreateUser> {
    const { username } = input
    if (this.users.has(username)) {
      return { error: 'username already used' }
    }
    const user = new User(input, context.timestamp)
    this.users.set(username, user)
    return ok
  }

  changeUsername(input: t.ChangeUsername['in']): Result<t.ChangeUsername> {
    if (this.users.has(input.to_username)) {
      return { error: 'new username already used' }
    }
    const user = this.users.get(input.from_username)
    if (!user) {
      return { error: 'original username is not used' }
    }
    this.users.delete(user.profile.username)
    user.profile.username = input.to_username
    this.users.set(user.profile.username, user)
    return ok
  }
}
