const eachSeries = require('async/eachSeries');
const db = require('./db');
const migrations = require('./migrations');

const { log } = console;
const { keys } = Object;

const migrationsToRun = {
  tags: false,
  customers: false,
  extractedHosts: false,
  extractedUrls: false,
  users: false,
  orders: false,
  lineItems: false,
  urlAcknowledgments: false,
  campaigns: false,
  identities: false,
  emailCategories: false,
  emailDeployments: false,
  emailSends: false,
  emailSendUrls: false,
  eventEmailClicks: false,
};

const run = async () => {
  await db.connect();
  log('Databases connected.');

  await eachSeries(keys(migrations).filter(key => migrationsToRun[key]), async (key) => {
    log(`Migration "${key}" starting...`);
    await migrations[key]();
    log(`Migration "${key}" complete.`);
  });

  await db.close();
  log('DONE!');
};

process.on('unhandledRejection', (e) => { throw e; });
run().catch(e => setImmediate(() => { throw e; }));
