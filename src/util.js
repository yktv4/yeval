'use strict';

const { isPlainObject, isFunction, castArray } = require('lodash');

const executeAsync = func => Promise.resolve().then(func);

const msgFor = (rules, msg) => (value, data, path) => {
  const returnMessageOnError = validationResult => {
    if (containsError(validationResult)) {
      return msg;
    }
  };

  let validatePromise;
  if (isPlainObject(rules)) {
    const { createValidator } = require('./runners');
    validatePromise = createValidator(rules, data, path)(value);
  } else {
    validatePromise = firstError(rules)(value, data, path);
  }

  return validatePromise.then(returnMessageOnError);
};

const allErrors = rules => {
  const rulesToApply = castArray(rules);
  return (value, data, path) => {
    // launch validation rules in series
    return rulesToApply.reduce(
      (acc, rule) => {
        return acc.then(result => {
          return executeAsync(() => rule(value, data, path)).then(Array.prototype.concat.bind(result));
        });
      },
      Promise.resolve([])
    );
  };
};

const firstError = rules => {
  const rulesToApply = castArray(rules);
  return (value, data, path) => {
    // launch validation rules in series
    return rulesToApply.reduce(
      (acc, rule) => {
        return acc.then(result => {
          if (containsError(result)) {
            // if an error was returned by previous rule then don't execute any rules further
            return acc;
          } else {
            return acc.then(() => executeAsync(() => rule(value, data, path)));
          }
        });
      },
      Promise.resolve()
    );
  };
};

const when = (predicate, rules) => (value, data, path) => {
  return Promise.resolve()
    .then(() => isFunction(predicate) ? predicate(value, data, path) : predicate)
    .then(shouldExecute => {
      if (Boolean(shouldExecute)) {
        if (isPlainObject(rules)) {
          const { createValidator } = require('./runners');
          return createValidator(rules, data, path)(value);
        } else {
          return firstError(rules)(value, data, path);
        }
      }
    });
};

const oneOfRules = rules => {
  const rulesToApply = castArray(rules);
  return (value, data, path) => {
    return allErrors(rulesToApply)(value, data, path)
      .then(errors => {
        // if all rules have failed return the first error
        if (errors.filter(err => !err).length === 0) {
          return errors.filter(err => !!err)[0];
        }
      });
  };
};

const each = rules => {
  return (value, data, path) => {
    const validateEachElement = value.reduce(
      (acc, currentElement, currentIndex) => {
        let allElementsResultsArray;
        return acc
          .then(resultsArray => {
            allElementsResultsArray = resultsArray;
          })
          .then(() => {
            const pathToCurrentElement = path.concat([currentIndex.toString()]);
            let validatePromise;
            if (isPlainObject(rules)) {
              const { createValidator } = require('./runners');
              validatePromise = createValidator(rules, data, pathToCurrentElement)(currentElement);
            } else {
              validatePromise = firstError(rules)(currentElement, data, pathToCurrentElement);
            }

            return validatePromise;
          })
          .then(resultForThisElement => {
            return allElementsResultsArray.concat([resultForThisElement]);
          });
      },
      Promise.resolve([])
    );

    return validateEachElement
      .then(result => {
        if (result.filter(containsError).length > 0) {
          return result;
        }
      })
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
  each,
};
