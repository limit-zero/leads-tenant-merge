const db = require('./db');

const { log } = console;

const run = async () => {
  await db.connect();
  log('Databases connected.');

  await db.close();
  log('DONE!');
};

process.on('unhandledRejection', (e) => { throw e; });
run().catch(e => setImmediate(() => { throw e; }));
