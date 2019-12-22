const db = require('../db');

const { log } = console;

const updateEvents = async () => {
  log('Setting migration data to DDT email click events...');

  // Mark all as insertable.
  const $set = { 'migrate.action': 'insert' };
  await db.collection('ddt', 'event-email-clicks').updateMany({}, { $set });
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateEvents();
};
