export type CreateUser = {
  id: 1
  call_type: 'command'
  type: 'create_user'
  in: {
    username: string
    email: string
  }
  out: void
  feed: void
  error: 'username already used'
}

export type GetAllUsernames = {
  id: 2
  call_type: 'query'
  type: 'get_all_usernames'
  in: void
  out: {
    usernames: string[]
  }
  feed: void
  error: never
}

export type ChangeUsername = {
  id: 3
  call_type: 'command'
  type: 'change_username'
  in: {
    from_username: string
    to_username: string
  }
  out: void
  feed: void
  error: 'original username is not used' | 'new username already used'
}

export type CheckUsernameExist = {
  id: 4
  call_type: 'query'
  type: 'check_username_exist'
  in: {
    username: string
  }
  out: {
    used: boolean
  }
  feed: void
  error: never
}

export type DeleteUsername = {
  id: 5
  call_type: 'command'
  type: 'delete_username'
  in: {
    username: string
  }
  out: void
  feed: void
  error: 'username is not used'
}

export type LogBrowserStats = {
  id: 6
  call_type: 'command'
  type: 'log_browser_stats'
  in: {
    userAgent?: string
    language?: string
    languages?: string[]
    deviceMemory?: number
    hardwareConcurrency?: number
    maxTouchPoints?: number
    platform?: string
    vendor?: string
    connection?: {
      downlink: number
      effectiveType: string
      saveData: boolean
    }
    cookieEnabled?: boolean
  }
  out: void
  feed: void
  error: never
}

export type SubscribeUsername = {
  id: 7
  call_type: 'subscribe'
  type: 'subscribe_username'
  in: void
  out: {
    feed_id: string
  }
  feed: {
    new_username: string
    del_username: string
    change_username: {
      from_username: string
      to_username: string
    }
  }
  error: never
}

export type CancelSubscribe = {
  id: 8
  call_type: 'command'
  type: 'cancel_subscribe'
  in: {
    feed_id: string
  }
  out: void
  feed: void
  error: never
}

export type Command =
  | CreateUser
  | ChangeUsername
  | DeleteUsername
  | LogBrowserStats
  | CancelSubscribe

export type Query =
  | GetAllUsernames
  | CheckUsernameExist

export type Subscribe =
  | SubscribeUsername

export type Call = Command | Query | Subscribe

export type CallIn =
  | Pick<CreateUser, 'id' | 'in'>
  | Pick<GetAllUsernames, 'id' | 'in'>
  | Pick<ChangeUsername, 'id' | 'in'>
  | Pick<CheckUsernameExist, 'id' | 'in'>
  | Pick<DeleteUsername, 'id' | 'in'>
  | Pick<LogBrowserStats, 'id' | 'in'>
  | Pick<SubscribeUsername, 'id' | 'in'>
  | Pick<CancelSubscribe, 'id' | 'in'>

type Result<T extends Call> =
  | { error: T['error'] }
  | { error?: undefined, out: T['out'] }

export type CallOut =
  | Result<CreateUser>
  | Result<GetAllUsernames>
  | Result<ChangeUsername>
  | Result<CheckUsernameExist>
  | Result<DeleteUsername>
  | Result<LogBrowserStats>
  | Result<SubscribeUsername>
  | Result<CancelSubscribe>