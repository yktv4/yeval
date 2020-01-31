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
  return async (value, data, path = []) => {
    if (!isPlainObject(value)) {
      return `Property ${path.join('.')} must be an object`;
    }

    // if no data passed as second parameter, assume current value is all the data
    data = isEmpty(data) ? value : data;
    const errors = {};
    // create an array of functions that will validate each attribute
    const validators = map(rules, (rulesForKey, keyToValidate) => {
      const pathToCurrentKey = path.concat(keyToValidate);
      const dataToValidate = value[keyToValidate];
      const storeErrors = validationResult => {
        if (containsError(validationResult)) {
          errors[keyToValidate] = validationResult;
        }
      };

      return () => createValidator(rulesForKey, data, pathToCurrentKey)(dataToValidate).then(storeErrors);
    });

    // execute functions from array one by one
    await validators.reduce((acc, validate) => acc.then(validate), Promise.resolve());
    if (Object.keys(errors).length !== 0) {
      return errors
    }
  };
};

const msgFor = (rules, msg) => async (value, data, path) => {
  const result = await createValidator(rules, data, path)(value);
  if (containsError(result)) {
    return msg;
  }
};

const allErrors = rules => {
  return (value, data, path) => {
    // launch validation rules in series
    return rules.reduce(
      async (getPreviousErrors, rule) => {
        const previousErrors = await getPreviousErrors;
        const errorForCurrentRule = await createValidator(rule, data, path)(value);
        return previousErrors.concat(errorForCurrentRule);
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
      async (getPreviousResult, rule) => {
        const previousResult = await getPreviousResult;
        if (containsError(previousResult)) {
          // if an error was returned by previous rule then don't execute any rules further
          return previousResult;
        }

        return createValidator(rule, data, path)(value);
      },
      Promise.resolve()
    );
  };
};

const when = (predicate, rules) => async (value, data, path) => {
  const shouldExecute = await executeAsync(() => isFunction(predicate) ? predicate(value, data, path) : predicate);
  if (Boolean(shouldExecute)) {
    return createValidator(rules, data, path)(value);
  }
};

const oneOfRules = rules => {
  const rulesArray = castArray(rules);
  return async (value, data, path) => {
    const results = await allErrors(rulesArray)(value, data, path);

    // if all rules have failed return the first error
    const resultsContainingErrors = results.filter(containsError);
    if (resultsContainingErrors.length === rulesArray.length) {
      return resultsContainingErrors[0];
    }
  };
};

const each = rules => {
  return async (value, data, path = []) => {
    const validateEachElement = value.reduce(
      async (getPreviousResults, currentElement, currentIndex) => {
        const previousResults = await getPreviousResults;
        const pathToCurrentElement = path.concat(currentIndex.toString());
        const currentResult = await createValidator(rules, data, pathToCurrentElement)(currentElement);
        return previousResults.concat(currentResult);
      },
      Promise.resolve([])
    );

    const results = await validateEachElement;
    if (results.filter(containsError).length > 0) {
      return results;
    }
  };
};

module.exports = {
  oneOfRules,
  when,
  msgFor,
  isDefined,
  each,
  createValidator,
  validatePlainObject,
  containsError,
};
