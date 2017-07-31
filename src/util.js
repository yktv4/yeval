'use strict';

const { isPlainObject, isFunction, castArray } = require('lodash');

const executeAsync = func => Promise.resolve().then(func);

const msgFor = (rules, msg) => (value, data) => {
  const returnMessageOnError = validationResult => {
    if (containsError(validationResult)) {
      return msg;
    }
  };

  let validatePromise;
  if (isPlainObject(rules)) {
    const createValidator = require('./create-validator');
    validatePromise = createValidator(rules, data)(value);
  } else {
    validatePromise = firstError(castArray(rules))(value, data);
  }

  return validatePromise.then(returnMessageOnError);
};

const allErrors = rules => {
  const rulesToApply = castArray(rules);
  return (value, data) => {
    // launch validation rules in series
    return rulesToApply.reduce(
      (acc, rule) => {
        return acc.then(result => executeAsync(() => rule(value, data)).then(Array.prototype.concat.bind(result)));
      },
      Promise.resolve([])
    );
  };
};

const firstError = rules => {
  const rulesToApply = castArray(rules);
  return (value, data) => {
    // launch validation rules in series
    return rulesToApply.reduce(
      (acc, rule) => {
        return acc.then(error => {
          if (error !== undefined) {
            // if an error was returned by previous rule then don't execute any rules further
            return acc;
          } else {
            return acc.then(() => executeAsync(() => rule(value, data)));
          }
        });
      },
      Promise.resolve()
    );
  };
};

const when = (predicate, rules) => (value, data) => {
  return Promise.resolve()
    .then(() => isFunction(predicate) ? predicate(value, data) : predicate)
    .then(shouldExecute => {
      if (Boolean(shouldExecute)) {
        if (isPlainObject(rules)) {
          const createValidator = require('./create-validator');
          return createValidator(rules, data)(value);
        } else {
          return firstError(rules)(value, data);
        }
      }
    });
};

const oneOfRules = rules => {
  const rulesToApply = castArray(rules);
  return (value, data) => {
    return allErrors(rulesToApply)(value, data)
      .then(errors => {
        // if all rules have failed return the first error
        if (errors.filter(err => !err).length === 0) {
          return errors.filter(err => !!err)[0];
        }
      });
  };
};

const containsError = validationResult => validationResult !== undefined;

const isDefined = value => value !== undefined;

module.exports = {
  oneOfRules,
  when,
  firstError,
  msgFor,
  containsError,
  isDefined,
};
