'use strict';

const { isPlainObject, map } = require('lodash');
const Promise = require('bluebird');
const { firstError, containsError } = require('./util');

const returnUndefinedOnSuccess = errors => {
  return Object.keys(errors).length === 0 ? undefined : errors;
};

const createValidator = perAttributeRules => {
  return data => {
    const errors = {};
    const executors = map(perAttributeRules, (rulesForKey, keyToValidate) => {
      const dataToValidate = data[keyToValidate];
      const storeErrors = validationResult => {
        if (containsError(validationResult)) {
          errors[keyToValidate] = validationResult;
        }
      };
      let validateFunction;

      if (isPlainObject(rulesForKey)) {
        if (!isPlainObject(dataToValidate)) {
          validateFunction = () => Promise.resolve(`Property ${keyToValidate} must be an object`);
        } else {
          validateFunction = () => createValidator(rulesForKey)(dataToValidate).then(storeErrors);
        }
      } else {
        validateFunction = () => firstError(rulesForKey)(data[keyToValidate], data).then(storeErrors);
      }

      return validateFunction;
    });

    return Promise
      .mapSeries(executors, executor => executor())
      .then(() => errors)
      .then(returnUndefinedOnSuccess);
  };
};

module.exports = createValidator;
