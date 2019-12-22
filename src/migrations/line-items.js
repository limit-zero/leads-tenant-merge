const db = require('../db');

const { log } = console;

const updateLineItems = async () => {
  log('Setting migration data to DDT line items...');

  // Mark all line items as insertable.
  const $set = { 'migrate.action': 'insert' };
  await db.collection('ddt', 'line-items').updateMany({}, { $set });
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateLineItems();
};
