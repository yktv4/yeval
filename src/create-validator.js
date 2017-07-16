'use strict';

const { isPlainObject, isEmpty, isString, map } = require('lodash');
const Promise = require('bluebird');
const { firstError } = require('./rules');

const containsError = validationResult => {
  const isErrorString = isString(validationResult);
  const isErrorObject = isPlainObject(validationResult) && !isEmpty(validationResult);

  return isErrorString || isErrorObject;
};

const createValidator = perAttributeRules => {
  return data => {
    const errors = {};
    const executors = map(perAttributeRules, (rulesForKey, keyToValidate) => {
      const dataToValidate = data[keyToValidate];
      const checkForErrors = validationResult => {
        if (containsError(validationResult)) {
          errors[keyToValidate] = validationResult;
        }
      };
      let validateFunction;

      if (isPlainObject(rulesForKey)) {
        if (!isPlainObject(dataToValidate)) {
          validateFunction = () => Promise.resolve(`Property ${keyToValidate} must be an object`);
        } else {
          validateFunction = () => createValidator(rulesForKey)(dataToValidate).then(checkForErrors);
        }
      } else {
        validateFunction = () => firstError(rulesForKey)(data[keyToValidate], data).then(checkForErrors);
      }

      return validateFunction;
    });

    return Promise.mapSeries(executors, executor => executor()).then(() => errors);
  };
};

module.exports = createValidator;
