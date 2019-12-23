const chalk = require('chalk');
const fetch = require('node-fetch');
const db = require('./db');

const { log } = console;

const badEmailIds = [
  '70868',
  '71092',
  '71093',
  '71295',
  '71297',
  '71695',
  '71697',
  '71858',
  '71861',
  '72050',
  '72083',
  '72084',
  '72274',
  '72275',
  '72311',
  '72494',
  '72496',
];

const run = async () => {
  await db.connect();
  log('Databases connected.');

  const startDate = new Date(1575266400000);

  // const emailIds = await db.collection('ddt', 'click-requests').distinct('req.query.dep', {
  //   date: { $gte: startDate },
  // });

  // log(chalk`Found {yellow ${emailIds.length}} email IDs.`);

  // const badEmailIds = [];
  // await each(emailIds, async (emailId) => {
  //   const url = `https://leads-ddt.limit0.io/exact-target/deployment/${emailId}`;
  //   const res = await fetch(url);
  //   log(chalk`Retrieved {gray ${url}}`);
  //   if (!res.ok) {
  //     badEmailIds.push(emailId);
  //   }
  // });
  // log(chalk`Found {yellow ${badEmailIds.length}} {red BAD} email IDs.`);
  // log(badEmailIds.sort());

  // Verify that the bad are good in IEN.

  // const verifiedEmailIds = [];
  // await each(badEmailIds, async (emailId) => {
  //   const url = `https://leads.limit0.io/exact-target/deployment/${emailId}`;
  //   const res = await fetch(url);
  //   log(chalk`Retrieved {gray ${url}}`);
  //   if (res.ok) {
  //     verifiedEmailIds.push(emailId);
  //   }
  // });
  // log(chalk`Found {yellow ${verifiedEmailIds.length}} verified email IDs.`);

  const cursor = db.collection('ddt', 'click-requests').find({
    date: { $gte: startDate },
    'req.query.dep': { $in: badEmailIds },
    processed: { $ne: true },
  }, {
    projection: { req: 1, date: 1 },
    sort: { date: 1 },
  });
  const count = await cursor.count(true);
  log(chalk`Found {yellow ${count}} requests to fix.`);

  let n = 0;
  await db.iterateCursor(cursor, async (doc) => {
    const url = `http://0.0.0.0:8288/click${doc.req.url}`;
    const headers = {
      'x-disable-redirect': 1,
      'x-timestamp': doc.date.valueOf(),
    };
    log(chalk`Fetching {blue ${doc._id}}\n{gray ${url}}\nEvent Date {magenta ${doc.date}}`);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const e = new Error('Bad response');
      e.res = res;
      throw e;
    }
    await db.collection('ddt', 'click-requests').updateOne({ _id: doc._id }, {
      $set: { processed: true },
    });
    n += 1;
    log(`Fetch ${n} of ${count} complete`);
    log('');
  });

  await cursor.close();

  await db.close();
  log(chalk`{green DONE!}`);
};

process.on('unhandledRejection', (e) => { throw e; });
run().catch(e => setImmediate(() => { throw e; }));
