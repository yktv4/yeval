'use strict';

const runners = require('./src/runners');

module.exports = {
  createValidator: runners.createValidator,
  validate: runners.validate,
  rules: require('./src/rules'),
  util: require('./src/util'),
};
