import { remove } from '@beenotung/tslib/array'
import { mapGetArray } from '@beenotung/tslib/map'
import {
  checkedGetSessionByIn,
  getSessionByIn,
  Session,
} from '../core/connection'
import {
  CancelSubscribe,
  DeleteByKey,
  GetValue,
  ListKeys,
  SetKV,
  SubscribeByKey,
} from './types'

type Result<T> = T
const ok = { Success: true as true }

interface KeySubscription {
  session: Session

  notice(Value: string): void

  close(): void
}

export class LogicProcessor {
  adminPassword = 'secret' // can be changed dynamically
  mem = new Map<string, string>()
  keySubscriptions = new Map<string, KeySubscription[]>()
  subscripts = new Map<string, KeySubscription>()

  lastSubId = 0

  CancelSubscribe(In: CancelSubscribe['In']): Result<CancelSubscribe['Out']> {
    const sub = this.subscripts.get(In.id)
    // make sure the user is not cancelling other users subscription
    if (sub?.session === getSessionByIn(In)) {
      sub.close()
    }
    return ok
  }

  SetKV(In: SetKV['In']): Result<SetKV['Out']> {
    this.mem.set(In.Key, In.Value)
    this.keySubscriptions.get(In.Key)?.forEach(sub => sub.notice(In.Value))
    return { Success: true }
  }

  authAdmin<T>(
    In: { AdminPassword: string },
    f: () => T,
  ):
    | T
    | {
        Success: false
        Reason: 'Wrong Admin Password'
      } {
    if (In.AdminPassword !== this.adminPassword) {
      return { Success: false, Reason: 'Wrong Admin Password' }
    }
    return f()
  }

  DeleteByKey(In: DeleteByKey['In']): Result<DeleteByKey['Out']> {
    return this.authAdmin(In, () => {
      this.mem.delete(In.Key)
      return ok
    })
  }

  GetValue(In: GetValue['In']): Result<GetValue['Out']> {
    if (this.mem.has(In.Key)) {
      return { Success: true, Value: this.mem.get(In.Key) }
    }
    return { Success: false, Reason: 'KeyNotFound' }
  }

  ListKeys(In: ListKeys['In']): Result<ListKeys['Out']> {
    return this.authAdmin(In, () => {
      return {
        Success: true,
        Keys: Array.from(this.mem.keys()),
      }
    })
  }

  getNextSubId() {
    // FIXME use crypto-safe id if there's no auth for the API
    return (++this.lastSubId).toString(36)
  }

  SubscribeByKey(
    In: SubscribeByKey['In'],
  ): Result<{ id: string } | { error: any }> {
    const session = checkedGetSessionByIn(In)
    const { Key } = In
    const id = this.getNextSubId()
    const subscription: KeySubscription = {
      session,
      notice(Value: string) {
        session.spark.send(id, { Value })
      },
      close: () => {
        this.subscripts.delete(id)
        const subs = mapGetArray(this.keySubscriptions, Key)
        remove(subs, subscription)
      },
    }
    this.subscripts.set(id, subscription)
    mapGetArray(this.keySubscriptions, Key).push(subscription)
    return { id }
  }
}
