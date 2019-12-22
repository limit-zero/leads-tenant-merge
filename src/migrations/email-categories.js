const db = require('../db');

const { log } = console;

const updateEmailCategories = async () => {
  log('Setting migration data to DDT mail categories...');

  const projection = { name: 1, fullName: 1 };

  const ddtCategories = await db.collection('ddt', 'email-categories').find({}, { projection }).toArray();

  // Mark all as insertable, but modify name to be prefixed with DDT.
  const bulkOps = ddtCategories.map((category) => {
    const $set = {
      'migrate.action': 'insert',
      'migrate.fields.name': `From DDT: ${category.name}`,
      'migrate.fields.fullName': `From DDT: ${category.fullName}`,
      'externalSource.clientId': 7323587,
    };
    const updateOne = { filter: { _id: category._id }, update: { $set } };
    return { updateOne };
  });
  await db.collection('ddt', 'email-categories').bulkWrite(bulkOps);
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateEmailCategories();
};
