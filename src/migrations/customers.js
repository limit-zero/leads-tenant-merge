const db = require('../db');
const createDupeMapper = require('../utils/create-dupe-mapper');
const updateRefOne = require('../utils/update-ref-one');

const { log } = console;

const dupeMapper = createDupeMapper();

const updateCustomers = async () => {
  log('Setting migration data to DDT customers...');

  const projection = { key: 1 };

  const ddtCustomers = await db.collection('ddt', 'customers').find({ deleted: { $ne: true } }, { projection }).toArray();
  const ddtKeys = ddtCustomers.map(({ key }) => key);

  const ienCustomers = await db.collection('ien', 'customers').find({
    key: { $in: ddtKeys },
    deleted: { $ne: true },
  }, { projection }).toArray();

  const ienKeyMap = ienCustomers.reduce((map, customer) => {
    map.set(customer.key, customer._id);
    return map;
  }, new Map());

  const bulkOps = ddtCustomers.map((customer) => {
    const ienId = ienKeyMap.get(customer.key);
    const action = ienId ? 'skip' : 'insert';
    const $set = {
      'migrate.action': action,
      ...(ienId && { 'migrate.ienId': ienId }),
    };

    const updateOne = { filter: { _id: customer._id }, update: { $set } };
    return { updateOne };
  });

  await db.collection('ddt', 'customers').bulkWrite(bulkOps);
  log('DDT migration data set.');
};

const updateCampaigns = async () => {
  const customerMap = await dupeMapper('customers');
  await updateRefOne({
    resource: 'campaigns',
    field: 'customerId',
    dupeMap: customerMap,
  });
};

const updateExtractedHosts = async () => {
  const customerMap = await dupeMapper('customers');
  await updateRefOne({
    resource: 'extracted-hosts',
    field: 'customerId',
    dupeMap: customerMap,
  });
};

module.exports = async () => {
  await updateCustomers();
  await updateCampaigns();
  await updateExtractedHosts();
};
