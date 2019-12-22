const db = require('../db');
const createDupeMapper = require('../utils/create-dupe-mapper');
const updateRefs = require('../utils/update-refs');

const { log } = console;

const dupeMapper = createDupeMapper();

const updateUsers = async () => {
  log('Setting migration data to DDT users...');

  const projection = { email: 1 };

  const ddtUsers = await db.collection('ddt', 'users').find({ deleted: { $ne: true } }, { projection }).toArray();
  const ddtEmails = ddtUsers.map(({ email }) => email);

  const ienUsers = await db.collection('ien', 'users').find({
    email: { $in: ddtEmails },
    deleted: { $ne: true },
  }, { projection }).toArray();

  const ienEmailMap = ienUsers.reduce((map, user) => {
    map.set(user.email, user._id);
    return map;
  }, new Map());

  const bulkOps = ddtUsers.map((user) => {
    const ienId = ienEmailMap.get(user.email);
    const action = ienId ? 'skip' : 'insert';
    const $set = {
      'migrate.action': action,
      ...(ienId && { 'migrate.ienId': ienId }),
    };

    const updateOne = { filter: { _id: user._id }, update: { $set } };
    return { updateOne };
  });

  await db.collection('ddt', 'users').bulkWrite(bulkOps);
  log('DDT migration data set.');
};

const updateOrders = async () => {
  const userMap = await dupeMapper('users');
  await updateRefs.one({
    resource: 'orders',
    field: 'salesRepId',
    dupeMap: userMap,
  });
};

module.exports = async () => {
  await updateUsers();
  await updateOrders();
};
