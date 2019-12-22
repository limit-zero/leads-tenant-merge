const db = require('../db');

const { log } = console;

const createCursor = async ({ resource, field, dupeMap }) => {
  log(`Updating '${field}' on ${resource}...`);

  const ddtIds = [...dupeMap.values()].map(({ ddtId }) => ddtId);

  const filter = { [field]: { $in: ddtIds } };
  const projection = { [field]: 1 };
  const cursor = db.collection('ddt', resource).find(filter, { projection });

  const n = await cursor.count();
  log(`Found ${n} ${resource} to update.`);
  return cursor;
};

const handleWrite = async ({
  resource,
  field,
  cursor,
  bulkOps,
}) => {
  log('Writing data...');
  if (bulkOps.length) await db.collection('ddt', resource).bulkWrite(bulkOps);
  await cursor.close();
  log(`Update complete for ${resource}.${field}`);
};

const one = async ({ resource, field, dupeMap }) => {
  const cursor = await createCursor({ resource, field, dupeMap });
  const bulkOps = [];
  await db.iterateCursor(cursor, (doc) => {
    const { ienId } = dupeMap.get(`${doc[field]}`);
    const $set = { [`migrate.fields.${field}`]: ienId };
    const updateOne = { filter: { _id: doc._id }, update: { $set } };
    bulkOps.push({ updateOne });
  });
  await handleWrite({
    resource,
    field,
    cursor,
    bulkOps,
  });
};

const many = async ({ resource, field, dupeMap }) => {
  const cursor = await createCursor({ resource, field, dupeMap });
  const bulkOps = [];
  await db.iterateCursor(cursor, (doc) => {
    const newRefIds = doc[field].map((refId) => {
      const ids = dupeMap.get(`${refId}`);
      if (ids) return ids.ienId;
      return refId;
    });
    const $set = { [`migrate.fields.${field}`]: newRefIds };
    const updateOne = { filter: { _id: doc._id }, update: { $set } };
    bulkOps.push({ updateOne });
  });
  await handleWrite({
    resource,
    field,
    cursor,
    bulkOps,
  });
};

module.exports = {
  one,
  many,
};
