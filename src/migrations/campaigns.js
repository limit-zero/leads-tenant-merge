const db = require('../db');

const { log } = console;

const updateCampaigns = async () => {
  log('Setting migration data to DDT campaigns...');

  // Mark all campaigns as insertable.
  const $set = { 'migrate.action': 'insert' };
  await db.collection('ddt', 'campaigns').updateMany({}, { $set });
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateCampaigns();
};
