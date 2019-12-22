const db = require('../db');

const { log } = console;

const updateEmailSends = async () => {
  log('Setting migration data to DDT email sends...');

  // Mark all as insertable.
  const $set = {
    'migrate.action': 'insert',
    'externalSource.clientId': 7323587,
  };
  await db.collection('ddt', 'email-sends').updateMany({}, { $set });
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateEmailSends();
};
