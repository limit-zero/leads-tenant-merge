const {
  cleanEnv,
  validators,
  str,
} = require('@base-cms/env');

const { nonemptystr } = validators;

module.exports = cleanEnv(process.env, {
  DB_HOST: nonemptystr(),

  IEN_DB_USER: nonemptystr(),
  IEN_DB_PASS: nonemptystr(),
  IEN_DB_AUTH: str(),
  IEN_DB_NAME: nonemptystr(),

  DDT_DB_USER: nonemptystr(),
  DDT_DB_PASS: nonemptystr(),
  DDT_DB_AUTH: str(),
  DDT_DB_NAME: nonemptystr(),
});
