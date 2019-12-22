const fetch = require('node-fetch');
const eachSeries = require('async/eachSeries');
const each = require('async/each');
const db = require('../db');
const createDupeMapper = require('../utils/create-dupe-mapper');
const updateRefs = require('../utils/update-refs');

const { log } = console;

const dupeMapper = createDupeMapper();

const updateIdentities = async () => {
  log('Setting migration data to DDT identities...');

  const projection = { 'externalSource.identifier': 1 };

  const ddtIdentities = await db.collection('ddt', 'identities').find({ deleted: { $ne: true } }, { projection }).toArray();
  const ddtIdentifiers = ddtIdentities.map(({ externalSource }) => externalSource.identifier);

  const ienIdentities = await db.collection('ien', 'identities').find({
    'externalSource.namespace': 'FuelSOAP:Subscriber',
    'externalSource.identifier': { $in: ddtIdentifiers },
  }, { projection }).toArray();

  const ienIdentifierMap = ienIdentities.reduce((map, identity) => {
    map.set(identity.externalSource.identifier, identity._id);
    return map;
  }, new Map());

  const bulkOps = ddtIdentities.map((identity) => {
    const ienId = ienIdentifierMap.get(identity.externalSource.identifier);
    const action = ienId ? 'skip' : 'insert';
    const $set = {
      'migrate.action': action,
      ...(ienId && { 'migrate.ienId': ienId }),
    };

    const updateOne = { filter: { _id: identity._id }, update: { $set } };
    return { updateOne };
  });

  await db.collection('ddt', 'identities').bulkWrite(bulkOps);
  log('DDT migration data set.');
};

const checkApiExistence = async () => {
  log('Verifying API data for DDT identities...');

  const identities = await db.collection('ddt', 'identities').find({
    'migrate.action': 'insert',
    'migrate.apiVerified': { $exists: false },
  }, {
    projection: { 'externalSource.identifier': 1 },
  }).toArray();

  const pageSize = 50;
  const batchCount = Math.ceil(identities.length / pageSize);
  const batches = [];

  for (let i = 0; i < batchCount; i += 1) {
    const start = i * pageSize;
    const end = start + pageSize;
    batches.push(identities.slice(start, end));
  }

  await eachSeries(batches, async (batch) => {
    log('Starting new batch.');
    const bulkOps = [];
    await each(batch, async (identity) => {
      const { identifier } = identity.externalSource;
      const url = `https://leads.limit0.io/exact-target/subscriber/${identifier}`;
      const res = await fetch(url);
      const $set = {};
      if (res.ok) {
        $set['migrate.apiVerified'] = true;
      } else {
        $set['migrate.apiVerified'] = false;
        const body = await res.json();
        $set['migrate.apiError'] = body;
      }
      const updateOne = { filter: { _id: identity._id }, update: { $set } };
      bulkOps.push({ updateOne });
    });
    log('Writing batch...');
    await db.collection('ddt', 'identities').bulkWrite(bulkOps);
    log('Batch write complete');
  });

  log('DDT API identify verification complete.');
};

const updateEventEmailClicks = async () => {
  const identityMap = await dupeMapper('identities');
  await updateRefs.one({
    resource: 'event-email-clicks',
    field: 'usr',
    dupeMap: identityMap,
  });
};


module.exports = async () => {
  await updateIdentities();
  await checkApiExistence();
  await updateEventEmailClicks();
};
