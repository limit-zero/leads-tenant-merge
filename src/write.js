const eachSeries = require('async/eachSeries');
const chalk = require('chalk');
const db = require('./db');

const { log } = console;
const { keys } = Object;

const collectonsToRun = [
  'campaigns',
  'customers',
  'email-categories',
  'email-deployments',
  'email-send-urls',
  'email-sends',
  'event-email-clicks',
  'extracted-hosts',
  'extracted-urls',
  'identities',
  'line-items',
  'orders',
  'tags',
  'url-acknowledgments',
  'users',
];

const run = async () => {
  await db.connect();
  log('Databases connected.');

  await eachSeries(collectonsToRun, async (collName) => {
    log('');
    log(chalk`Writing data for the {blue ${collName}} collection...`);

    const filter = {
      'migrate.action': 'insert',
      'migrate.complete': { $ne: true },
    };

    const numOfDocs = await db.collection('ddt', collName).countDocuments(filter);
    const batchSize = 500;
    const batchCount = Math.ceil(numOfDocs / batchSize);

    const batches = [];
    for (let i = 0; i < batchCount; i += 1) {
      batches.push(i + 1);
    }

    log(chalk`Found {yellow ${numOfDocs}} total ${collName}. Running {yellow ${batchCount}} batches...`);
    await eachSeries(batches, async (n) => {
      log(`Starting batch ${n} of ${batches.length}`);
      const cursor = db.collection('ddt', collName).find(filter, { limit: batchSize });

      const bulkInsertOps = [];
      const bulkUpdateOps = [];
      await db.iterateCursor(cursor, (doc) => {
        const { fields } = doc.migrate;
        const toInsert = { ...doc };
        if (fields) {
          keys(fields).forEach((k) => {
            toInsert[k] = fields[k];
          });
        }
        const insertOne = { document: toInsert };
        bulkInsertOps.push({ insertOne });

        const $set = { 'migrate.complete': true };
        const updateOne = { filter: { _id: doc._id }, update: { $set } };
        bulkUpdateOps.push({ updateOne });
      });
      log(chalk`{gray Inserting docs into IEN...}`);
      await db.collection('ien', collName).bulkWrite(bulkInsertOps);
      log(chalk`{gray Flagging DDT docs as migrated...}`);
      await db.collection('ddt', collName).bulkWrite(bulkUpdateOps);

      await cursor.close();
      log('Batch complete.');
    });


    log(chalk`Write for {blue ${collName}} {green complete}.`);
    log('');
  });

  await db.close();
  log('DONE!');
};

process.on('unhandledRejection', (e) => { throw e; });
run().catch(e => setImmediate(() => { throw e; }));
