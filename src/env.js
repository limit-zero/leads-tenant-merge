const {
  cleanEnv,
  validators,
} = require('@base-cms/env');

const { nonemptystr } = validators;

module.exports = cleanEnv(process.env, {
  MONGO_DSN_DDT: nonemptystr({ desc: 'The MongoDB DSN to connect to for DDT.' }),
  MONGO_DSN_IEN: nonemptystr({ desc: 'The MongoDB DSN to connect to for IEN.' }),
});
