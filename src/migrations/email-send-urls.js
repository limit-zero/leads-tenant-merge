const db = require('../db');

const { log } = console;

const updateEmailSendUrls = async () => {
  log('Setting migration data to DDT email send URLs...');

  // Mark all as insertable.
  const $set = { 'migrate.action': 'insert' };
  await db.collection('ddt', 'email-send-urls').updateMany({}, { $set });
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateEmailSendUrls();
};
