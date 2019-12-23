const { MongoClient } = require('mongodb');
const {
  DB_HOST,

  IEN_DB_USER,
  IEN_DB_PASS,
  IEN_DB_AUTH,
  IEN_DB_NAME,

  DDT_DB_USER,
  DDT_DB_PASS,
  DDT_DB_AUTH,
  DDT_DB_NAME,
} = require('./env');

const createDbName = tenant => (tenant === 'ien' ? IEN_DB_NAME : DDT_DB_NAME);

const createClient = (tenant) => {
  const dbName = createDbName(tenant);
  const dsn = `mongodb://${DB_HOST}/${dbName}`;
  const options = {
    useUnifiedTopology: true,
    authSource: (tenant === 'ien' ? IEN_DB_AUTH : DDT_DB_AUTH) || undefined,
    user: tenant === 'ien' ? IEN_DB_USER : DDT_DB_USER,
    password: tenant === 'ien' ? IEN_DB_PASS : DDT_DB_PASS,
    replicaSet: 'apps',
    readPreference: 'primaryPreferred',
    w: 3,
    connectTimeoutMS: 1000,
  };
  return new MongoClient(dsn, options);
};

const clients = {
  ddt: createClient('ddt'),
  ien: createClient('ien'),
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
  const dbName = createDbName(tenant);
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
  clients,
};
