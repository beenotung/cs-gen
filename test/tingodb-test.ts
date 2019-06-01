let Db = require('tingodb')().Db;
let db = new Db('data', {});
let collection = db.collection('collection');
collection.insert([{ timestamp: Date.now() }], { w: 1 }, (err, res) => {
  console.log({ err, res });
});
collection.insert(
  [{ user: 'Alice' }, { user: 'Bob' }],
  { w: 1 },
  (err, res) => {
    console.log({ err, res });
    collection.findOne({ user: 'Alice' }, (err, res) => {
      console.log({ err, res });
    });
  },
);
