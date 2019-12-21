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

module.exports = {
  connect,
  close,
};
