const { MongoClient } = require('mongodb');
const { MONGO_DSN_IEN, MONGO_DSN_DDT } = require('./env');

const clientOptions = { useUnifiedTopology: true };

const clients = {
  ddt: new MongoClient(MONGO_DSN_DDT, clientOptions),
  ien: new MongoClient(MONGO_DSN_IEN, clientOptions),
};

const connect = () => Promise.all([
  clients.ddt.connect(),
  clients.ien.connect(),
]);

const close = force => Promise.all([
  clients.ddt.close(force),
  clients.ien.close(force),
]);

const collection = (tenant, name) => {
  const client = clients[tenant];
  if (!client) throw new Error('No mongodb client found for the provided tenant');
  const dbName = tenant === 'ien' ? 'leads-graph' : 'leads-graph-ddt';
  return client.db(dbName).collection(name);
};

const iterateCursor = async (cursor, cb) => {
  if (await cursor.hasNext()) {
    const doc = await cursor.next();
    await cb(doc);
    await iterateCursor(cursor, cb);
  }
};

module.exports = {
  connect,
  close,
  collection,
  iterateCursor,
};
