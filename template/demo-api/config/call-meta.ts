import { CallMeta } from '../helpers/types'

export let callMetas: CallMeta[] = [
  {
    id: 1,
    call_type: 'command',
    type: 'create_user',
    replay: true,
    in: {
      username: 'text',
      email: 'text',
    },
    errors: ['username already used'],
  },
  {
    id: 2,
    call_type: 'command',
    type: 'change_username',
    replay: true,
    in: {
      from_username: 'text',
      to_username: 'text',
    },
    errors: ['username already used'],
  },
  {
    id: 3,
    call_type: 'query',
    type: 'check_username_exist',
    replay: false,
    in: {
      username: 'text',
    },
    out: {
      used: ['integer', 'boolean'],
    },
  },
  {
    id: 4,
    call_type: 'query',
    type: 'get_all_username',
    replay: false,
    out: {
      usernames: ['text', 'string[]'],
    },
  },
  {
    id: 5,
    call_type: 'command',
    type: 'report_stats',
    replay: false,
    in: {
      appCodeName: 'text', // e.g. Mozilla
      appName: 'text', // e.g. Netscape
      appVersion: 'text', // e.g. 5.0 (Windows)
      language: 'text', // e.g. en-US
      languages: ['text', 'string[]'], // e.g. ['en-US', 'en']
      oscpu: 'text', // e.g. Windows NT 10.0; Win64; x64
      platform: 'text', // e.g. Win32
      product: 'text', // e.g. Gecko
      userAgent: 'text', // e.g. Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0
      vendor: 'text', // e.g. Google Inc.
    },
  },
  {
    id: 6,
    call_type: 'subscribe',
    type: 'subscribe_users',
    replay: false,
    out: {
      feed_id: 'text',
    },
  },
  {
    id: 7,
    call_type: 'command',
    type: 'cancel_subscribe',
    replay: false,
    in: {
      feed_id: 'text',
    },
  },
]
// callMetas.forEach(call => (call.out['ok'] = 'integer'))
