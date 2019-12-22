const db = require('../db');

const { log } = console;

const updateEmailDeployments = async () => {
  log('Setting migration data to DDT email deployments...');

  // Mark all as insertable.
  const $set = {
    'migrate.action': 'insert',
    'externalSource.clientId': 7323587,
  };
  await db.collection('ddt', 'email-deployments').updateMany({}, { $set });
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateEmailDeployments();
};
