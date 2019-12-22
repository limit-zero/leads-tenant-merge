const createDupeLoader = require('./create-dupe-loader');

module.exports = () => {
  let dupeMap;
  const dupeLoader = createDupeLoader();
  return async (resource) => {
    const dupes = await dupeLoader(resource);
    if (!dupeMap) {
      dupeMap = dupes.reduce((map, doc) => {
        map.set(`${doc._id}`, {
          ddtId: doc._id,
          ienId: doc.migrate.ienId,
        });
        return map;
      }, new Map());
    }
    return dupeMap;
  };
};
