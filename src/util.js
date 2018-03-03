'use strict';

const { isPlainObject, isFunction, isArray, castArray, isEmpty, map } = require('lodash');

const isDefined = value => value !== undefined;

const containsError = isDefined;

const executeAsync = func => Promise.resolve().then(func);

const createValidator = (rule, data, path = []) => value => {
  let validatePromise;
  if (isPlainObject(rule)) {
    validatePromise = validatePlainObject(rule)(value, data, path);
  } else if (isFunction(rule)) {
    validatePromise = executeAsync(() => rule(value, data, path));
  } else if (isArray(rule)) {
    validatePromise = firstError(rule)(value, data, path);
  } else {
    validatePromise = Promise.reject(new Error(`Unknown rule supplied of type ${typeof rule}`));
  }
  return validatePromise;
};

/**
 *
 * @param rules {Object} plain object describing rules for each attribute.
 * @return {function} function that you can run against your data to validate.
 */
const validatePlainObject = (rules) => {
  const returnUndefinedOnSuccess = errors => Object.keys(errors).length === 0 ? undefined : errors;
  return (value, data, path = []) => {
    // if no data passed as second parameter, assume current value is all the data
    data = isEmpty(data) ? value : data;
    const errors = {};
    // create an array of functions that will validate each attribute
    const validators = map(rules, (rulesForKey, keyToValidate) => {
      const pathToCurrentKey = path.concat([keyToValidate]);
      const dataToValidate = value[keyToValidate];
      const storeErrors = validationResult => {
        if (containsError(validationResult)) {
          errors[keyToValidate] = validationResult;
        }
      };

      return () => createValidator(rulesForKey, data, pathToCurrentKey)(dataToValidate).then(storeErrors);
    });

    // execute functions from array one by one
    return validators.reduce((acc, validate) => acc.then(validate), Promise.resolve())
      .then(() => errors)
      .then(returnUndefinedOnSuccess);
  };
};

const msgFor = (rules, msg) => (value, data, path) => {
  const returnMessageOnError = validationResult => containsError(validationResult) ? msg : undefined;
  return createValidator(rules, data, path)(value).then(returnMessageOnError);
};

const allErrors = rules => {
  return (value, data, path) => {
    // launch validation rules in series
    return rules.reduce(
      (acc, rule) => {
        return acc.then(result => {
          return createValidator(rule, data, path)(value).then(Array.prototype.concat.bind(result));
        });
      },
      Promise.resolve([])
    );
  };
};

const firstError = rules => {
  const rulesArray = castArray(rules);
  return (value, data, path) => {
    // launch validation rules in series
    return rulesArray.reduce(
      (acc, rule) => {
        return acc.then(result => {
          if (containsError(result)) {
            // if an error was returned by previous rule then don't execute any rules further
            return acc;
          } else {
            return createValidator(rule, data, path)(value);
          }
        });
      },
      Promise.resolve()
    );
  };
};

const when = (predicate, rules) => (value, data, path) => {
  return executeAsync(() => isFunction(predicate) ? predicate(value, data, path) : predicate)
    .then(shouldExecute => {
      if (Boolean(shouldExecute)) {
        return createValidator(rules, data, path)(value);
      }
    });
};

const oneOfRules = rules => {
  const rulesArray = castArray(rules);
  return (value, data, path) => {
    return allErrors(rulesArray)(value, data, path)
      .then(errors => {
        // if all rules have failed return the first error
        if (errors.filter(err => !err).length === 0) {
          return errors.filter(err => !!err)[0];
        }
      });
  };
};

const each = rules => {
  const returnUndefinedOnSuccess = result => result.filter(containsError).length > 0 ? result : undefined;
  return (value, data, path = []) => {
    const validateEachElement = value.reduce(
      (acc, currentElement, currentIndex) => {
        let allElementsResultsArray;
        return acc
          .then(resultsArray => {
            allElementsResultsArray = resultsArray;
          })
          .then(() => {
            const pathToCurrentElement = path.concat([currentIndex.toString()]);
            return createValidator(rules, data, pathToCurrentElement)(currentElement);
          })
          .then(resultForThisElement => {
            return allElementsResultsArray.concat([resultForThisElement]);
          });
      },
      Promise.resolve([])
    );

    return validateEachElement.then(returnUndefinedOnSuccess);
  };
};

module.exports = {
  oneOfRules,
  when,
  firstError,
  msgFor,
  isDefined,
  each,
  createValidator,
  validatePlainObject,
};
