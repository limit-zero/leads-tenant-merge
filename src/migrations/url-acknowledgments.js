const db = require('../db');

const { log } = console;

const updateUrlAcknowledgments = async () => {
  log('Setting migration data to DDT url acknowledgments...');

  // Mark all as insertable.
  const $set = { 'migrate.action': 'insert' };
  await db.collection('ddt', 'url-acknowledgments').updateMany({}, { $set });
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateUrlAcknowledgments();
};
