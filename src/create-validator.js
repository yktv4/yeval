'use strict';

const rules = require('./rules');
const util = require('./util');

const containsError = validationResult => {
  const isErrorString = typeof validationResult === 'string';
  const isErrorObject = util.isObject(validationResult) && !util.isEmptyObject(validationResult);

  return isErrorString || isErrorObject;
};

const createValidator = perAttributeRules => {
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
          const validateEnclosedObjectAsync = createValidator(valueOfKey);
          validatePromise = validateEnclosedObjectAsync(dataToValidate);
        }
      } else {
        const validateAttributeAsync = rules.allOfRules(valueOfKey);
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

module.exports = createValidator;
