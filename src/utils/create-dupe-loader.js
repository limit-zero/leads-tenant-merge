const db = require('../db');

module.exports = () => {
  /**
   * Loads documents that exists in both IEN and DDT.
   */
  let promise;
  return async (resource) => {
    const filter = { 'migrate.ienId': { $exists: true } };
    const projection = { 'migrate.ienId': 1 };
    if (!promise) promise = db.collection('ddt', resource).find(filter, { projection }).toArray();
    return promise;
  };
};
