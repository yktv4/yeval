'use strict';

const validators = require('./validators');

module.exports = {
  validator: perAttributeRules => {
    return data => {
      const errors = {};
      Object.keys(perAttributeRules).forEach((key) => {
        const validateAttribute = validators.allOfRules(perAttributeRules[key]);
        const error = validateAttribute(data[key], data);
        if (error) {
          errors[key] = error;
        }
      });
      return errors;
    };
  },
  asyncValidator: perAttributeRules => {
    return data => {
      const errors = {};
      const promises = [];
      Object.keys(perAttributeRules).forEach(attributeName => {
        const attributeRules = perAttributeRules[attributeName];
        const validateAttributeAsync = validators.allOfRulesAsync(attributeRules);
        const validatePromise = validateAttributeAsync(data[attributeName], data)
          .then(error => {
            if (error) {
              errors[attributeName] = error;
            }
          });
        promises.push(validatePromise);
      });
      return Promise.all(promises).then(() => errors);
    };
  }
};
