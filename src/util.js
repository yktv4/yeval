'use strict';

const { isPlainObject, isFunction, castArray } = require('lodash');

const msgFor = (rule, msg) => (value, data) => rule(value, data) ? msg : undefined;

const allErrors = rules => {
  const rulesToApply = castArray(rules);
  return (value, data) => {
    // launch validation rules in series
    return rulesToApply.reduce(
      (acc, rule) => {
        return acc.then(result => Promise.resolve().then(() => rule(value, data))
          .then(Array.prototype.concat.bind(result)));
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
            return acc.then(() => Promise.resolve().then(() => rule(value, data)));
          }
        });
      },
      Promise.resolve()
    );
  };
};

const when = (predicate, rules) => {
  return (value, data) => {
    return Promise.resolve()
      .then(() => isFunction(predicate) ? predicate(value, data) : Boolean(predicate))
      .then(shouldExecute => {
        if (shouldExecute) {
          if (isPlainObject(rules)) {
            const createValidator = require('./create-validator');
            return createValidator(rules)(value);
          } else {
            return firstError(rules)(value, data);
          }
        }
      });
  };
};

const oneOfRules = rules => {
  const rulesToApply = castArray(rules);
  return (value, data) => {
    return allErrors(rulesToApply)(value, data)
      .then(errors => {
        if (errors.filter(err => !err).length === 0) {
          return errors.filter(err => !!err)[0];
        }
      });
  };
};

module.exports = {
  oneOfRules,
  when,
  firstError,
  allErrors,
  msgFor,
};
