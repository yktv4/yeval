'use strict';

const _ = require('lodash');

/**
 * helper functions to compose validation rules
 */

const msgFor = (rule, msg) => (value, data) => rule(value, data) ? msg : undefined;

const allErrors = rules => {
  const rulesToApply = _.castArray(rules);
  return (value, data) => {
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
  const rulesToApply = _.castArray(rules);
  return (value, data) => {
    return allErrors(rulesToApply)(value, data)
      .then(errors => errors.filter(err => !!err))
      .then(errors => errors[0]);
  };
};

const when = (predicate, rules) => {
  return (value, data) => {
    return Promise.resolve()
      .then(() => _.isBoolean(predicate) ? predicate : predicate(value, data))
      .then(shouldExecute => {
        if (shouldExecute) {
          return firstError(rules)(value, data);
        }
      });
  };
};

const oneOfRules = rules => {
  const rulesToApply = _.castArray(rules);
  return (value, data) => {
    return allErrors(rulesToApply)(value, data)
      .then(errors => {
        if (errors.filter(err => !err).length === 0) {
          return errors.filter(err => !!err)[0];
        }
      });
  };
};

/**
 * Validators that return errors
 */

const email = (value) => {
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i.test(value)) {
    return 'Must be a valid email address';
  }
};

const required = (value) => {
  if (_.isUndefined(value)) {
    return 'Required';
  }
};

const isDate = (value) => {
  const dateRegexp = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegexp.test(value)) {
    return 'Must be a valid date (yyyy-mm-dd)';
  }
};

const isArray = (value) => {
  if (!_.isArray(value)) {
    return 'Must be an array';
  }
};

const isPlainObject = (value) => {
  if (!_.isPlainObject(value)) {
    return 'Must be a plain object';
  }
};

const minLength = (min) => {
  return value => {
    if (!(value !== undefined && value !== null && _.isNumber(value.length) && value.length < min)) {
      return `Length must be no less than ${min}`;
    }
  };
};

const maxLength = (max) => {
  return value => {
    if (!(value !== undefined && value !== null && _.isNumber(value.length) && value.length > max)) {
      return `Length must be no more than ${max}`;
    }
  };
};

const minValue = (min) => {
  return value => {
    if (parseFloat(value) < min) {
      return `Must be at least ${min}`;
    }
  };
};

const maxValue = (max) => {
  return value => {
    if (parseFloat(value) > max) {
      return `Must be at most ${max}`;
    }
  };
};

const isInteger = (value) => {
  if (!_.isInteger(value)) {
    return 'Must be an integer';
  }
};

const isFloat = (value) => {
  if (!(_.isNumber(value) && Number(value) === value && value % 1 !== 0)) {
    return 'Must be a float';
  }
};

const isNumber = (value) => {
  if (!_.isNumber(value)) {
    return 'Must be a number';
  }
};

const isBoolean = (value) => {
  if (!_.isBoolean(value)) {
    return 'Must be boolean';
  }
};

const isString = (value) => {
  if (!_.isString(value)) {
    return 'Must be string';
  }
};

const oneOfArray = (enumeration) => {
  return value => {
    if (!~enumeration.indexOf(value)) {
      return `Must be one of: ${enumeration.join(', ')}`;
    }
  };
};

const equals = toWhat => value => {
  if (value !== toWhat) {
    return `Must match ${toWhat}`;
  }
};

const sameAs = fieldName => (value, data) => {
  if (data[fieldName] !== value) {
    return `Must match ${fieldName}`;
  }
};

module.exports = {
  msgFor,
  firstError,
  when,
  oneOfRules,
  email,
  required,
  isDate,
  isArray,
  isPlainObject,
  minLength,
  maxLength,
  minValue,
  maxValue,
  isInteger,
  isFloat,
  isNumber,
  isBoolean,
  isString,
  oneOfArray,
  equals,
  sameAs,
};
