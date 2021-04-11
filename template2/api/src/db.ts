import DB from "better-sqlite3-helper";

let db = DB({
  path: 'test.db',
  fileMustExist: false,
  readonly: false,
  migrate: false,
})
db.run(`
  create table if not exists "data"
  (
    id   integer primary key,
    json json,
    blob blob
  );`)

// db.insert('data', {
//   json: JSON.stringify([1, 2, 3]),
//   blob: Buffer.from('binary data str')
// })

console.log(db.prepare(`select *
                        from "data"`).all());
