const db = require('../db');

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

  const tagsToMigrate = ddtTags.filter(tag => ienNameMap.has(tag.name));
  const bulkOps = tagsToMigrate.map((tag) => {
    // Must do atomic updates to prevent overwriting other migration data.
    const $set = { 'migrate._id': ienNameMap.get(tag.name) };
    const updateOne = { filter: { _id: tag._id }, update: { $set } };
    return { updateOne };
  });

  await db.collection('ddt', 'tags').bulkWrite(bulkOps);
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateTags();
};
