'use strict';

const isObject = object => typeof object === 'object' && object.toString() === '[object Object]';

const isEmptyObject = object => Object.getOwnPropertyNames(object).length === 0;

module.exports = {
  isObject,
  isEmptyObject,
};
