const db = require('../db');

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

module.exports = async () => {
  await updateCustomers();
};
