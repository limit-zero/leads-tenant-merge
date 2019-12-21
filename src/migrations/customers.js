const db = require('../db');
const createDupeMapper = require('../utils/create-dupe-mapper');

const { log } = console;

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
  log('Updating `customerId` on campaigns...');
  const dupeMapper = createDupeMapper();
  const customerMap = await dupeMapper('customers');
  const ddtCustomerIds = [...customerMap.values()].map(({ ddtId }) => ddtId);

  const campaignCursor = db.collection('ddt', 'campaigns').find({ customerId: { $in: ddtCustomerIds } }, {
    projection: { customerId: 1 },
  });
  const n = await campaignCursor.count();
  log(`Found ${n} campaigns to update.`);

  const bulkOps = [];
  await db.iterateCursor(campaignCursor, (campaign) => {
    const { ienId } = customerMap.get(`${campaign.customerId}`);
    const $set = { 'migrate.fields.customerId': ienId };
    const updateOne = { filter: { _id: campaign._id }, update: { $set } };
    bulkOps.push({ updateOne });
  });
  log('Writing data...');
  if (bulkOps.length) await db.collection('ddt', 'campaigns').bulkWrite(bulkOps);
  await campaignCursor.close();
  log('Campaign update complete.');
};

module.exports = async () => {
  await updateCustomers();
  await updateCampaigns();
};
