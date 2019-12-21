const db = require('../db');
const createDupeMapper = require('../utils/create-dupe-mapper');

const { log } = console;

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
  log('Updating `tagIds` on extracted URLs...');
  const dupeMapper = createDupeMapper();
  const tagMap = await dupeMapper('tags');
  const ddtTagIds = [...tagMap.values()].map(({ ddtId }) => ddtId);

  const urlCursor = db.collection('ddt', 'extracted-urls').find({ tagIds: { $in: ddtTagIds } }, {
    projection: { tagIds: 1 },
  });
  const n = await urlCursor.count();
  log(`Found ${n} URLs to update.`);

  const bulkOps = [];
  await db.iterateCursor(urlCursor, (url) => {
    const newTagIds = url.tagIds.map((tagId) => {
      const ids = tagMap.get(`${tagId}`);
      if (ids) {
        return ids.ienId;
      }
      return tagId;
    });
    const $set = { 'migrate.fields.tagIds': newTagIds };
    const updateOne = { filter: { _id: url._id }, update: { $set } };
    bulkOps.push({ updateOne });
  });
  log('Writing data...');
  if (bulkOps.length) await db.collection('ddt', 'extracted-urls').bulkWrite(bulkOps);
  await urlCursor.close();
  log('Extracted URL update complete.');
};

module.exports = async () => {
  await updateTags();
  await updateExtractedUrls();
};
