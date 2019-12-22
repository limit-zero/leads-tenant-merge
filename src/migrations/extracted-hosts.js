const db = require('../db');
const createDupeMapper = require('../utils/create-dupe-mapper');
const updateRefs = require('../utils/update-refs');

const { log } = console;

const dupeMapper = createDupeMapper();

const updateExtractedHosts = async () => {
  log('Setting migration data to DDT hosts...');

  const projection = { value: 1 };

  const ddtHosts = await db.collection('ddt', 'extracted-hosts').find({}, { projection }).toArray();
  const ddtValues = ddtHosts.map(({ value }) => value);

  const ienHosts = await db.collection('ien', 'extracted-hosts').find({
    value: { $in: ddtValues },
  }, { projection }).toArray();

  const ienValueMap = ienHosts.reduce((map, host) => {
    map.set(host.value, host._id);
    return map;
  }, new Map());

  const bulkOps = ddtHosts.map((host) => {
    const ienId = ienValueMap.get(host.value);
    // @todo what should happen if an item is set to skip, but has fields that need
    // to be modified?
    const action = ienId ? 'skip' : 'insert';
    const $set = {
      'migrate.action': action,
      ...(ienId && { 'migrate.ienId': ienId }),
    };

    const updateOne = { filter: { _id: host._id }, update: { $set } };
    return { updateOne };
  });

  await db.collection('ddt', 'extracted-hosts').bulkWrite(bulkOps);
  log('DDT migration data set.');
};

const updateExtractedUrls = async () => {
  const hostMap = await dupeMapper('extracted-hosts');
  await updateRefs.one({
    resource: 'extracted-urls',
    field: 'resolvedHostId',
    dupeMap: hostMap,
  });
};

module.exports = async () => {
  await updateExtractedHosts();
  await updateExtractedUrls();
};
