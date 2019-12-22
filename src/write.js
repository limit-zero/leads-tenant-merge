const eachSeries = require('async/eachSeries');
const db = require('./db');

const { log } = console;
const { keys } = Object;

const collectonsToRun = [
  'tags',
];

const run = async () => {
  await db.connect();
  log('Databases connected.');

  await eachSeries(collectonsToRun, async (collName) => {
    log(`Writing data for the "${collName}" collection...`);

    const filter = {
      'migrate.action': 'insert',
      'migrate.complete': { $ne: true },
    };

    const numOfDocs = await db.collection('ddt', collName).countDocuments(filter);
    const batchSize = 500;
    const batchCount = Math.ceil(numOfDocs / batchSize);

    const skips = [];
    for (let i = 0; i < batchCount; i += 1) {
      skips.push(i * batchSize);
    }

    log(`Found ${numOfDocs} total ${collName}. Running ${batchCount} batches...`);
    await eachSeries(skips, async (skip) => {
      log('Batch starting...');
      const cursor = db.collection('ddt', collName).find(filter, { limit: batchSize, skip });

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
      log('Inserting docs into IEN...');
      await db.collection('ien', collName).bulkWrite(bulkInsertOps);
      log('Flagging DDT docs as migrated...');
      await db.collection('ddt', collName).bulkWrite(bulkUpdateOps);

      await cursor.close();
      log('Batch complete.');
    });

    log(`Write for "${collName}" complete.`);
  });

  await db.close();
  log('DONE!');
};

process.on('unhandledRejection', (e) => { throw e; });
run().catch(e => setImmediate(() => { throw e; }));
