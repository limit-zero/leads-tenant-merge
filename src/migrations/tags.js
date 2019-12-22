const db = require('../db');
const createDupeMapper = require('../utils/create-dupe-mapper');
const updateRefs = require('../utils/update-refs');

const { log } = console;

const dupeMapper = createDupeMapper();

const updateTags = async () => {
  log('Setting migration data to DDT tags...');

  const projection = { name: 1 };

  const [ienTags, ddtTags] = await Promise.all([
    db.collection('ien', 'tags').find({ deleted: { $ne: true } }, { projection }).toArray(),
    db.collection('ddt', 'tags').find({ deleted: { $ne: true } }, { projection }).toArray(),
  ]);

  const ienNameMap = ienTags.reduce((map, tag) => {
    map.set(tag.name, tag._id);
    return map;
  }, new Map());

  const bulkOps = ddtTags.map((tag) => {
    // Must do atomic updates to prevent overwriting other migration data.
    const ienId = ienNameMap.get(tag.name);
    const action = ienId ? 'skip' : 'insert';
    const $set = {
      'migrate.action': action,
      ...(ienId && { 'migrate.ienId': ienId }),
    };
    const updateOne = { filter: { _id: tag._id }, update: { $set } };
    return { updateOne };
  });

  await db.collection('ddt', 'tags').bulkWrite(bulkOps);
  log('DDT migration data set.');
};

const updateExtractedUrls = async () => {
  const tagMap = await dupeMapper('tags');
  await updateRefs.many({
    resource: 'extracted-urls',
    field: 'tagIds',
    dupeMap: tagMap,
  });
};

module.exports = async () => {
  await updateTags();
  await updateExtractedUrls();
};
