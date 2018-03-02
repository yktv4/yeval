'use strict';

const { isPlainObject, isEmpty, map } = require('lodash');
const { firstError, containsError } = require('./util');

const returnUndefinedOnSuccess = errors => {
  return Object.keys(errors).length === 0 ? undefined : errors;
};
const notEmpty = value => !isEmpty(value);

/**
 *
 * @param perAttributeRules {Object} plain object describing rules for each attribute.
 * @param wholeData {Object} data to be passed to validation rules as second argument.
 * this param is used internally, you shouldn't have a need to use it.
 * @param pathToCurrentData {Array} path to be passed to validation rules as third argument.
 * this param is used internally, you shouldn't have a need to use it.
 * @return {function} function that you can run against your data to validate.
 */
const createValidator = (perAttributeRules, wholeData = {}, pathToCurrentData = []) => {
  return currentData => {
    wholeData = isEmpty(wholeData) ? currentData : wholeData;
    const errors = {};
    // create an array of functions that will validate each attribute
    const validators = map(perAttributeRules, (rulesForKey, keyToValidate) => {
      const pathToCurrentKey = pathToCurrentData.concat([keyToValidate]);
      const dataToValidate = currentData[keyToValidate];
      const storeErrors = validationResult => {
        if (containsError(validationResult)) {
          errors[keyToValidate] = validationResult;
        }
      };

      let validateFunction;
      if (isPlainObject(rulesForKey)) {
        if (!isPlainObject(dataToValidate)) {
          validateFunction = () => Promise.resolve(`Property ${pathToCurrentKey.join('.')} must be an object`);
        } else {
          validateFunction = () => createValidator(rulesForKey, wholeData, pathToCurrentKey)(dataToValidate)
            .then(storeErrors);
        }
      } else {
        validateFunction = () => firstError(rulesForKey)(dataToValidate, wholeData, pathToCurrentKey).then(storeErrors);
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
