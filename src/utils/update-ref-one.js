const db = require('../db');

const { log } = console;

module.exports = async ({ resource, field, dupeMap }) => {
  log(`Updating '${field}' on ${resource}...`);

  const ddtIds = [...dupeMap.values()].map(({ ddtId }) => ddtId);

  const filter = { [field]: { $in: ddtIds } };
  const projection = { [field]: 1 };
  const cursor = db.collection('ddt', resource).find(filter, { projection });

  const n = await cursor.count();
  log(`Found ${n} ${resource} to update.`);

  const bulkOps = [];
  await db.iterateCursor(cursor, (doc) => {
    const { ienId } = dupeMap.get(`${doc[field]}`);
    const $set = { [`migrate.fields.${field}`]: ienId };
    const updateOne = { filter: { _id: doc._id }, update: { $set } };
    bulkOps.push({ updateOne });
  });
  log('Writing data...');
  if (bulkOps.length) await db.collection('ddt', resource).bulkWrite(bulkOps);
  await cursor.close();
  log(`Update complete for ${resource}.${field}`);
};
