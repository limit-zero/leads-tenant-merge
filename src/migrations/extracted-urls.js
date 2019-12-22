const db = require('../db');
const createDupeMapper = require('../utils/create-dupe-mapper');
const updateRefs = require('../utils/update-refs');

const { log } = console;

const dupeMapper = createDupeMapper();

const updateExtractedUrls = async () => {
  log('Setting migration data to DDT urls...');

  const projection = { 'values.original': 1 };

  const ddtUrls = await db.collection('ddt', 'extracted-urls').find({}, { projection }).toArray();
  const ddtValues = ddtUrls.map(({ values }) => values.original);

  const ienUrls = await db.collection('ien', 'extracted-urls').find({
    'values.original': { $in: ddtValues },
  }, { projection }).toArray();

  const ienValueMap = ienUrls.reduce((map, url) => {
    map.set(url.values.original, url._id);
    return map;
  }, new Map());

  const bulkOps = ddtUrls.map((url) => {
    const ienId = ienValueMap.get(url.values.original);
    // @todo what should happen if an item is set to skip, but has fields that need
    // to be modified?
    const action = ienId ? 'skip' : 'insert';
    const $set = {
      'migrate.action': action,
      ...(ienId && { 'migrate.ienId': ienId }),
    };

    const updateOne = { filter: { _id: url._id }, update: { $set } };
    return { updateOne };
  });

  await db.collection('ddt', 'extracted-urls').bulkWrite(bulkOps);
  log('DDT migration data set.');
};

const updateEmailSendUrls = async () => {
  const urlMap = await dupeMapper('extracted-urls');
  await updateRefs.one({
    resource: 'email-send-urls',
    field: 'urlId',
    dupeMap: urlMap,
  });
};

const updateUrlAcknowledgments = async () => {
  const urlMap = await dupeMapper('extracted-urls');
  await updateRefs.many({
    resource: 'url-acknowledgments',
    field: 'urlIds',
    dupeMap: urlMap,
  });
};

const updateEventEmailClicks = async () => {
  const urlMap = await dupeMapper('extracted-urls');
  await updateRefs.one({
    resource: 'event-email-clicks',
    field: 'url',
    dupeMap: urlMap,
  });
};

const updateCampaigns = async () => {
  const urlMap = await dupeMapper('extracted-urls');

  const ddtIds = [...urlMap.values()].map(({ ddtId }) => ddtId);

  const filter = { 'email.excludeUrls.urlId': { $in: ddtIds } };
  const projection = { 'email.excludeUrls': 1 };
  const cursor = db.collection('ddt', 'campaigns').find(filter, { projection });

  const n = await cursor.count();
  log(`Found ${n} campaigns to update.`);

  const bulkOps = [];
  await db.iterateCursor(cursor, (doc) => {
    const newRefs = doc.email.excludeUrls.map((ref) => {
      const ids = urlMap.get(`${ref.urlId}`);
      if (ids) return { ...ref, urlId: ids.ienId };
      return ref;
    });
    const $set = { 'migrate.fields.email.excludeUrls': newRefs };
    const updateOne = { filter: { _id: doc._id }, update: { $set } };
    bulkOps.push({ updateOne });
  });

  log('Writing data...');
  if (bulkOps.length) await db.collection('ddt', 'campaigns').bulkWrite(bulkOps);
  await cursor.close();
  log('Update complete for campaigns.email.excludeUrls');
};

module.exports = async () => {
  await updateExtractedUrls();
  await updateEmailSendUrls();
  await updateUrlAcknowledgments();
  await updateEventEmailClicks();
  await updateCampaigns();
};
