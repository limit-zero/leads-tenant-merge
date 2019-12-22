const tags = require('./tags');
const customers = require('./customers');
const extractedHosts = require('./extracted-hosts');
const extractedUrls = require('./extracted-urls');
const users = require('./users');
const orders = require('./orders');
const lineItems = require('./line-items');
const urlAcknowledgments = require('./url-acknowledgments');
const campaigns = require('./campaigns');
const identities = require('./identities');
const emailCategories = require('./email-categories');

module.exports = {
  tags,
  customers,
  extractedHosts,
  extractedUrls,
  users,
  orders,
  lineItems,
  urlAcknowledgments,
  campaigns,
  identities,
  emailCategories,
};
