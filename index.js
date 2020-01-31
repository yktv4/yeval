'use strict';

const util = require('./src/util');

module.exports = {
  validate: (rules, value) => util.createValidator(rules)(value),
  rules: require('./src/rules'),
  util,
};
