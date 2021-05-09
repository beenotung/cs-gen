import './test-db'
import { insertLog } from '../domain/db/insert-helpers'
import { ids } from '../domain/types'
import { replayLogs } from '../domain/logic-processor/engine-helpers'
import { expect } from 'chai'
import { logicalProcessor } from '../domain/logic-processor/instance'
import { db } from '../domain/db/config'
import { callMetas } from '../config/call-meta'

function clearLogs() {
  callMetas.forEach(call => {
    if (!call.in) {
      return
    }
    db.run(`delete from ${call.type}`)
  })
  db.run(`delete
          from log`)
  db.run(`delete
          from str`)
}

describe('basic flow', function () {
  before(() => {
    clearLogs()
  })

  it('should store logs', function () {
    let timestamp = Date.now()
    insertLog(timestamp, 0, {
      id: ids.create_user,
      in: { username: 'alice', email: 'alice@domain.net' },
    })
    insertLog(timestamp, 1, {
      id: ids.change_username,
      in: { from_username: 'alice', to_username: 'alice123' },
    })
  })

  it('should replay logs', function () {
    replayLogs()
  })

  it('should has state in logicalProcessor', function () {
    expect(logicalProcessor.users.size).equals(1)
    const user = logicalProcessor.users.get('alice123')
    expect(user).not.undefined
    expect(user?.profile).not.undefined
    expect(user?.profile.username).equals('alice123')
  })
})
