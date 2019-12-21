const db = require('./db');

const { log } = console;

const run = async () => {
  await db.connect();
  log('Databases connected.');

  const [c1, c2] = await Promise.all([
    db.collection('ien', 'tags').countDocuments(),
    db.collection('ddt', 'tags').countDocuments(),
  ]);

  log({ c1, c2 });

  await db.close();
  log('DONE!');
};

process.on('unhandledRejection', (e) => { throw e; });
run().catch(e => setImmediate(() => { throw e; }));
