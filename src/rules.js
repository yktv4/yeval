const _ = require('lodash');

const isEmail = (value) => {
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i.test(value)) {
    return 'Must be a valid email address';
  }
};

const required = (value) => {
  if (_.isUndefined(value)) {
    return 'Required';
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
    if (!(_.isNumber(value.length) && value.length >= min)) {
      return `Length must be no less than ${min}`;
    }
  };
};

const maxLength = (max) => {
  return value => {
    if (!(_.isNumber(value.length) && value.length <= max)) {
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
  if (!(_.isNumber(value) && Number(value) === value && isFinite(value) && value % 1 !== 0)) {
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
    return 'Must be a boolean';
  }
};

const isString = (value) => {
  if (!_.isString(value)) {
    return 'Must be a string';
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
  if (!_.isEqual(value, toWhat)) {
    return `Must be equal to ${toWhat}`;
  }
};

const sameAs = fieldName => (value, data) => {
  if (!_.isEqual(value, data[fieldName])) {
    return `Must match ${fieldName}`;
  }
};

module.exports = {
  isEmail,
  required,
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
