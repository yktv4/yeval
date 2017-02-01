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

const allOfRules = rules => {
  const rulesToApply = rules instanceof Array ? rules : [rules];
  return (value, data) => {
    return rulesToApply.map(rule => rule(value, data)).filter(err => !!err)[0];
  };
};

const allOfRulesAsync = rules => {
  const rulesToApply = rules instanceof Array ? rules : [rules];
  return (value, data) => {
    const promises = rulesToApply.map(rule => {
      return Promise.resolve().then(() => rule(value, data));
    });
    return Promise.all(promises)
      .then(errors => errors.filter(err => !!err))
      .then(errors => errors[0]);
  };
};

const when = (predicate, rules) => {
  return (value, data) => {
    if (predicate(value, data)) {
      return allOfRules(rules)(value, data);
    }
  };
};

const whenAsync = (asyncPredicate, rules) => {
  return (value, data) => {
    return Promise.resolve()
      .then(() => asyncPredicate(value, data))
      .then(shouldExecute => {
        if (shouldExecute) {
          return allOfRulesAsync(rules)(value, data);
        }
      });
  };
};

const oneOfRules = rules => {
  return (value, data) => {
    const errors = rules.map(rule => rule(value, data));
    if (errors.filter(err => !err).length === 0) {
      return errors.filter(err => !!err)[0];
    }
  };
};


/**
 * Validators that return errors
 */

const email = (value) => {
  if (!isEmpty(value) && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i.test(value)) {
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

module.exports = {
  isEmpty,
  notEmpty,
  isDefined,
  msgFor,
  allOfRules,
  allOfRulesAsync,
  when,
  whenAsync,
  oneOfRules,
  email,
  required,
  date,
  isAlpha,
  isArray,
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
};