import { ILogicalProcessor } from './logic-processor-interface'
import { ok } from './types'
import type { Result } from './types'
import type * as t from './types'
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
}
