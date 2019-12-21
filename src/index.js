const eachSeries = require('async/eachSeries');
const db = require('./db');
const segments = require('./segments');

const { log } = console;
const { keys } = Object;

const segmentsToRun = {
  tags: true,
};

const run = async () => {
  await db.connect();
  log('Databases connected.');

  await eachSeries(keys(segments).filter(key => segmentsToRun[key]), async (key) => {
    log(`Segment "${key}" starting...`);
    await segments[key]();
    log(`Segment "${key}" complete.`);
  });

  await db.close();
  log('DONE!');
};

process.on('unhandledRejection', (e) => { throw e; });
run().catch(e => setImmediate(() => { throw e; }));
