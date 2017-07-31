'use strict';

const { isPlainObject, isEmpty, map } = require('lodash');
const { firstError, containsError } = require('./util');

const returnUndefinedOnSuccess = errors => {
  return Object.keys(errors).length === 0 ? undefined : errors;
};

/**
 *
 * @param perAttributeRules {Object} plain object describing rules for each attribute
 * @param wholeData {Object} data to be passed to validation rules as second attribute. this param is used internally,
 * you shouldn't have a need to use it.
 * @return {function(*=)}
 */
const createValidator = (perAttributeRules, wholeData = {}) => {
  return currentData => {
    wholeData = isEmpty(wholeData) ? currentData : wholeData;
    const errors = {};
    // create an array of functions that will validate each attribute
    const validators = map(perAttributeRules, (rulesForKey, keyToValidate) => {
      const dataToValidate = currentData[keyToValidate];
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
          validateFunction = () => createValidator(rulesForKey, wholeData)(dataToValidate).then(storeErrors);
        }
      } else {
        validateFunction = () => firstError(rulesForKey)(dataToValidate, wholeData).then(storeErrors);
      }

      return validateFunction;
    });

    // execute functions from array one by one
    return validators.reduce((acc, validate) => acc.then(validate), Promise.resolve())
      .then(() => errors)
      .then(returnUndefinedOnSuccess);
  };
};

const validate = (rules, data) => createValidator(rules)(data);

module.exports = { createValidator, validate };
