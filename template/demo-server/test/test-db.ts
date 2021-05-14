import DB from 'better-sqlite3-helper'

let db = DB({ path: 'data/test.db' })

if (process.argv[1] === __filename) {
  let rows = db.query('select * from log_meta')
  console.log(rows)
}
