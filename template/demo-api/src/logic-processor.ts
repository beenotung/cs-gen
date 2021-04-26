import { CreateUser, Result, ok } from './types'
import { Context } from './engine-helpers'

class User {
  constructor(
    public profile: { username: string; email: string },
    public create_at: number,
  ) {}
}

export class LogicalProcessor {
  users = new Map<string, User>()

  createUser(input: CreateUser['in'], context: Context): Result<CreateUser> {
    const { username } = input
    if (this.users.has(username)) {
      return { error: 'username already used' }
    }
    const user = new User(input, context.timestamp)
    this.users.set(username, user)
    return ok
  }
}
