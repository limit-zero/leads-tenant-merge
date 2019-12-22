const db = require('../db');

const { log } = console;

const updateOrders = async () => {
  log('Setting migration data to DDT orders...');

  // Mark all orders as insertable.
  const $set = { 'migrate.action': 'insert' };
  await db.collection('ddt', 'orders').updateMany({}, { $set });
  log('DDT migration data set.');
};

module.exports = async () => {
  await updateOrders();
};
