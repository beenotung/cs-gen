import { CallMeta } from '../helpers/types'

export const callMetas: CallMeta[] = [
  {
    id: 1,
    call_type: 'command',
    type: 'create_user',
    replay: true,
    in: { username: 'text', email: 'text' },
    errors: ['username has been used already'],
  },
  {
    id: 2,
    call_type: 'query',
    type: 'get_all_usernames',
    replay: false,
    out: {
      usernames: ['text', 'string[]'],
    },
  },
  {
    id: 3,
    call_type: 'command',
    type: 'change_username',
    replay: true,
    in: {
      from_username: 'text',
      to_username: 'text',
    },
    errors: ['username is not used'],
  },
  {
    id: 4,
    call_type: 'query',
    type: 'check_username_exist',
    replay: false,
    in: {
      username: 'text',
    },
    out: {
      is_exists: ['integer', 'boolean'],
    },
  },
  {
    id: 5,
    call_type: 'command',
    type: 'delete_username',
    replay: true,
    in: {
      username: 'text',
    },
    errors: ['username is not used'],
  },
  {
    id: 6,
    call_type: 'command',
    type: 'log_browser_stats',
    replay: false,
    in: {
      'userAgent?': 'text',
      'language?': 'text',
      'languages?': ['text', 'string[]'],
      'deviceMemory?': 'integer',
      'hardwareConcurrency?': 'integer',
      'maxTouchPoints?': 'integer',
      'platform?': 'text',
      'vendor?': 'text',
      'connection?': [
        'text',
        `{
  downlink: number
  effectiveType: string
  saveData: boolean
}`,
      ],
    },
  },
  {
    id: 7,
    call_type: 'subscribe',
    type: 'subscribe_username',
    replay: false,
    out: {
      feed_id: 'text',
    },
    feed: {
      new_username: 'text',
      del_username: 'text',
      change_username: [
        'text',
        `{
  from_username: string
  to_username: string
}`,
      ],
    },
  },
  {
    id: 8,
    call_type: 'command',
    type: 'cancel_subscribe',
    replay: false,
    in: {
      feed_id: 'text',
    },
  },
]
