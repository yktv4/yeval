'use strict';

require('should');
const _ = require('lodash');
const yeval = require('./../index');
const v = yeval.validators;

describe('Validators creation', () => {
  const testValues = {
    deal: 'purchase',
    car: {
      make: 'BMW',
      model: '5-er',
      engine: {
        displacement: 4,
        cylinders: 6,
      },
    },
    owner: {
      name: 'Rick',
      surname: 'Astley',
    },
  };

  it('should perform sync validation of an object with enclosed properties', () => {
    const validate = yeval.create.validator({
      deal: v.isString,
      car: {
        make: [v.oneOfArray(['BMW', 'Mercedes', 'Audi'])],
        model: [v.oneOfArray(['3-er', '5-er', '7-er'])],
        engine: {
          displacement: v.isInteger,
          cylinders: v.isInteger,
        },
      },
      owner: {
        name: v.isString,
        surname: v.isString,
      },
    });

    const errors = validate(testValues);
    Object.keys(errors).should.have.lengthOf(0);
  });

  it('should perform async validation of an object with enclosed properties', () => {
    const notFailingAsyncValidationRule = (data, value) => Promise.resolve();

    const validateAsync = yeval.create.asyncValidator({
      deal: [v.isString, notFailingAsyncValidationRule],
      car: {
        make: [v.oneOfArray(['BMW', 'Mercedes', 'Audi']), notFailingAsyncValidationRule],
        model: [v.oneOfArray(['3-er', '5-er', '7-er']), notFailingAsyncValidationRule],
        engine: {
          displacement: [v.isInteger, notFailingAsyncValidationRule],
          cylinders: [v.isInteger, notFailingAsyncValidationRule],
        },
      },
      owner: {
        name: [v.isString, notFailingAsyncValidationRule],
        surname: [v.isString, notFailingAsyncValidationRule],
      },
    });

    return validateAsync(testValues)
      .then(errors => {
        Object.keys(errors).should.have.lengthOf(0);
      });
  });

  it('should populate errors object correctly when validation fails', () => {
    const validate = yeval.create.validator({
      deal: v.isString,
      car: {
        make: [v.oneOfArray(['BMW', 'Mercedes', 'Audi'])],
        model: [v.oneOfArray(['3-er', '5-er', '7-er'])],
        engine: {
          displacement: v.isInteger,
          cylinders: v.isInteger,
        },
      },
      owner: {
        name: v.isString,
        surname: v.isString,
      },
    });

    const thisCaseTestValues = _.cloneDeep(testValues);
    delete thisCaseTestValues.car.engine.cylinders;
    delete thisCaseTestValues.deal;

    const errors = validate(thisCaseTestValues);
    Object.keys(errors).should.have.lengthOf(2);

    errors.car.engine.cylinders.should.be.a.String();
    errors.deal.should.be.a.String();
  });

  it('should populate errors object correctly when async validation fails', () => {
    const notFailingAsyncValidationRule = (data, value) => Promise.resolve();
    const failingAsyncValidationRule = (data, value) => Promise.resolve('Some error');

    const validateAsync = yeval.create.asyncValidator({
      deal: [v.isString, failingAsyncValidationRule],
      car: {
        make: [v.oneOfArray(['BMW', 'Mercedes', 'Audi']), notFailingAsyncValidationRule],
        model: [v.oneOfArray(['3-er', '5-er', '7-er']), notFailingAsyncValidationRule],
        engine: {
          displacement: [v.isInteger, notFailingAsyncValidationRule],
          cylinders: [v.isInteger, failingAsyncValidationRule],
        },
      },
      owner: {
        name: [v.isString, notFailingAsyncValidationRule],
        surname: [v.isString, notFailingAsyncValidationRule],
      },
    });

    const thisCaseTestValues = _.cloneDeep(testValues);
    delete thisCaseTestValues.car.engine.cylinders;
    delete thisCaseTestValues.deal;

    return validateAsync(thisCaseTestValues)
      .then(errors => {
        Object.keys(errors).should.have.lengthOf(2);

        errors.car.engine.cylinders.should.be.a.String();
        errors.deal.should.be.a.String();
      });
  });
});
