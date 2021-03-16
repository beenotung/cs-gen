import {
  SubscribeUsers,
  CheckUsername,
  CreateUser,
  CancelSubscribe,
} from './calls'

export class LogicalProcessor {
  usernames = new Set<string>()

  CreateUser({ username }: CreateUser['In']): CreateUser['Out'] {
    if (this.usernames.has(username)) {
      return { Success: false, Reason: 'username already used' }
    }
    this.usernames.add(username)
    return { Success: true }
  }

  CheckUsername({ username }: CheckUsername['In']): CheckUsername['Out'] {
    return { Success: true, used: this.usernames.has(username) }
  }

  SubscribeUsers(In: SubscribeUsers['In']): SubscribeUsers['Out'] {
    return { Success: true, feed_id: 'TODO' }
  }

  CancelSubscribe(In: CancelSubscribe['In']): CancelSubscribe['Out'] {
    return { Success: true }
  }
}
