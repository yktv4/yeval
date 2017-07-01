'use strict';

/**
 * helper functions to compose validation rules
 */

const isEmpty = value => value === undefined || value === null || value === '';

const notEmpty = (value) => {
  return !isEmpty(value);
};

const isDefined = value => value !== undefined;

const msgFor = (rule, msg) => (value, data) => rule(value, data) ? msg : undefined;

const allErrorsOfRules = rules => {
  const rulesToApply = rules instanceof Array ? rules : [rules];
  return (value, data) => {
    const promises = rulesToApply.map(rule => {
      return Promise.resolve().then(() => rule(value, data));
    });
    return Promise.all(promises);
  };
};

const allOfRules = rules => {
  const rulesToApply = rules instanceof Array ? rules : [rules];
  return (value, data) => {
    return allErrorsOfRules(rulesToApply)(value, data)
      .then(errors => errors.filter(err => !!err))
      .then(errors => errors[0]);
  };
};

const when = (predicate, rules) => {
  return (value, data) => {
    return Promise.resolve()
      .then(() => typeof predicate === 'boolean' ? predicate : predicate(value, data))
      .then(shouldExecute => {
        if (shouldExecute) {
          return allOfRules(rules)(value, data);
        }
      });
  };
};

const oneOfRules = rules => {
  const rulesToApply = rules instanceof Array ? rules : [rules];
  return (value, data) => {
    return allErrorsOfRules(rulesToApply)(value, data)
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
    return 'Enter valid email address';
  }
};

const required = (value, data) => {
  if (isEmpty(value)) {
    return 'Required';
  }
};

const date = (value, data) => {
  const dateRegexp = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegexp.test(value)) {
    return 'Please enter a valid date(mm-dd-yyyy)';
  }
};

const isAlpha = (value) => {
  if (!/^[a-zA-Z,\-\.\'\"]*$/.test(value)) {
    return 'Only letters and ,-.\'" are allowed';
  }
};

const isArray = (value) => {
  if (!Array.isArray(value)) {
    return 'Must be an array';
  }
};

const isObject = (value) => {
  if (!(typeof value === 'object' && value.toString() === '[object Object]')) {
    return 'Must be an object';
  }
};

const minLength = (min) => {
  return value => {
    if (!isEmpty(value) && value.length < min) {
      return `Must be at least ${min} characters`;
    }
  };
};

const maxLength = (max) => {
  return value => {
    if (!isEmpty(value) && value.length > max) {
      return `Must be no more than ${max} characters`;
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
  if (!Number.isInteger(Number(value))) {
    return 'Must be an integer';
  }
};

const isFloat = (value) => {
  if (!(Number(value) === value && value % 1 !== 0)) {
    return 'Must be a float';
  }
};

const isNumber = (value) => {
  if (!(typeof value === 'number' && !isNaN(value))) {
    return 'Must be a number';
  }
};

const isBoolean = (value) => {
  if (!(typeof value === 'boolean')) {
    return 'Must be boolean';
  }
};

const isString = (value) => {
  if (!(typeof value === 'string')) {
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

const matches = fieldName => (value, data) => {
  if (data[fieldName] !== value) {
    return `Must match ${fieldName}`;
  }
};

module.exports = {
  isEmpty,
  notEmpty,
  isDefined,
  msgFor,
  allOfRules,
  when,
  oneOfRules,
  email,
  required,
  date,
  isAlpha,
  isArray,
  isObject,
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
  matches,
};
