'use strict';

const validators = require('./validators');
const util = require('./util');

const containsError = validationResult => {
  const isErrorString = typeof validationResult === 'string';
  const isErrorObject = util.isObject(validationResult) && !util.isEmptyObject(validationResult);

  return isErrorString || isErrorObject;
};

const validator = perAttributeRules => {
  return data => {
    const errors = {};
    Object.keys(perAttributeRules).forEach((key) => {
      const valueOfKey = perAttributeRules[key];
      let error;
      if (util.isObject(valueOfKey)) {
        const dataToValidate = data[key];
        if (!dataToValidate) {
          error = `Required property ${key} is missing`;
        } else {
          const validateEnclosedObject = validator(valueOfKey);
          error = validateEnclosedObject(dataToValidate);
        }
      } else {
        const validateAttribute = validators.allOfRules(valueOfKey);
        error = validateAttribute(data[key], data);
      }

      if (containsError(error)) {
        errors[key] = error;
      }
    });
    return errors;
  };
};

const asyncValidator = perAttributeRules => {
  return data => {
    const errors = {};
    const promises = [];
    Object.keys(perAttributeRules).forEach(key => {
      const valueOfKey = perAttributeRules[key];
      let validatePromise;
      if (util.isObject(valueOfKey)) {
        const dataToValidate = data[key];
        if (!dataToValidate) {
          validatePromise = Promise.resolve(`Required property ${key} is missing`);
        } else {
          const validateEnclosedObjectAsync = asyncValidator(valueOfKey);
          validatePromise = validateEnclosedObjectAsync(dataToValidate);
        }
      } else {
        const validateAttributeAsync = validators.allOfRulesAsync(valueOfKey);
        validatePromise = validateAttributeAsync(data[key], data);
      }

      validatePromise
        .then(error => {
          if (containsError(error)) {
            errors[key] = error;
          }
        });
      promises.push(validatePromise);
    });
    return Promise.all(promises).then(() => errors);
  };
};

module.exports = { validator, asyncValidator };
