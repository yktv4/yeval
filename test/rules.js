'use strict';

const should = require('should');
const { rules, util: { containsError } } = require('./../index');

const validateRule = (rule, validValues, invalidValues) => {
  validValues.map(rule).filter(containsError).length.should.be.eql(0);
  invalidValues.map(rule).filter(containsError).length.should.be.eql(invalidValues.length);
};

it('should validate email strings', () => {
  validateRule(rules.isEmail, ['notEmail@asd.asd'], ['notAnEmail', 'notEmail@', 'notEmail@asd']);
});

it('should require a value', () => {
  validateRule(rules.required, [null, '', 1, 1.1, {}, true, false, [], Function], [undefined]);
});

it('should validate arrays', () => {
  validateRule(rules.isArray, [[]], [undefined, null, '', 1, 1.1, {}, true, false, Function]);
});

it('should validate plain objects', () => {
  validateRule(rules.isPlainObject, [{}], [undefined, null, '', 1, 1.1, [], true, false, Object, Function]);
});

it('should validate min length', () => {
  validateRule(rules.minLength(3), [[1, 2, 3], 'asd'], [[1, 2], 'as', '']);
});

it('should validate max length', () => {
  validateRule(rules.maxLength(3), [[1, 2, 3], 'asd', ''], [[1, 2, 3, 4], 'asdf']);
});

it('should validate min value', () => {
  validateRule(rules.minValue(1), [1, 1.5, Infinity], [0.999999999, 0, -Infinity, -1]);
});

it('should validate max value', () => {
  validateRule(rules.maxValue(1), [0.999999999, 0, -Infinity, -1], [1.0000000001, 1.5, Infinity]);
});

it('should validate if value is an integer', () => {
  validateRule(
    rules.isInteger,
    [-100, -10, -1, 0, 1, 10, 100],
    [undefined, null, '', 1.1, [], true, false, Object, Infinity, Function]
  );
});

it('should validate if value is float', () => {
  validateRule(
    rules.isFloat,
    [-100.01, -10.1, -1.2, 0.3, 1.4, 10.5, 100.6],
    [undefined, null, '', 1, [], true, false, Object, Infinity, 1.0]
  );
});

it('should validate if value is a number', () => {
  validateRule(
    rules.isNumber,
    [-100.01, -10.1, -1.2, 0.3, 1.4, 10.5, 100.6, -100, -10, -1, 0, 1, 10, 100, Infinity],
    [undefined, null, '', [], true, false, Object, Function]
  );
});

it('should validate if value is boolean', () => {
  validateRule(rules.isBoolean, [true, false], [undefined, null, 1, 1.01, '', [], {}, Boolean, Function]);
});

it('should validate if value is a string', () => {
  validateRule(rules.isString, ['', 'asdasdasd'], [undefined, null, 1, 1.01, true, false, [], Function]);
});

it('should validate if value is present in array', () => {
  const validValues = [undefined, null, 1, 1.01, true, [], '', 'asd', Function];
  validateRule(rules.oneOfArray(validValues), validValues, [2, false, [123], Object, 1.11, {}, Infinity]);
});

it('should validate if value strictly equals', () => {
  validateRule(rules.equals(''), [''], [false, [], Function, 0, 1.11, {}, Infinity]);
  validateRule(rules.equals(false), [false], ['', 0, [], Function, 1.11, {}, Infinity]);
  validateRule(rules.equals(true), [true], ['true', 1, [], Function, 1.11, {}, Infinity]);
  validateRule(rules.equals(1.000001), [1.000001], [1, [], 0, Function, 1.11, {}, Infinity]);
});

it('should validate if value is same as another in the object', () => {
  const testWithValue = (value, invalidValue) => {
    const data = { repeatPassword: value };
    should(rules.sameAs('repeatPassword')(value, data)).be.undefined();
    should(rules.sameAs('repeatPassword')(invalidValue, data)).be.a.String();
  };

  [['somePassword', 'otherString'], [1, 2], [true, false], [false, true], [[322], [321]], [{}, { a: 1 }]]
    .map(([validValue, invalidValue]) => testWithValue(validValue, invalidValue));
});
