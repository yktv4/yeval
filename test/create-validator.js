'use strict';

require('should');
const _ = require('lodash');
const { createValidator, rules: { isString, isInteger, oneOfArray, oneOfRules } } = require('./../index');

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

  const notFailingAsyncValidationRule = () => Promise.resolve();
  const failingAsyncValidationRule = () => Promise.resolve('Some error');

  const validMakes = ['BMW', 'Mercedes', 'Audi'];
  const validModels = ['3-er', '5-er', '7-er'];

  it('should perform validation of an object with enclosed properties', () => {
    const validateAsync = createValidator({
      deal: [isString, notFailingAsyncValidationRule],
      car: {
        make: [oneOfArray(validMakes), notFailingAsyncValidationRule],
        model: [oneOfArray(validModels), notFailingAsyncValidationRule],
        engine: {
          displacement: [isInteger, oneOfRules([notFailingAsyncValidationRule, failingAsyncValidationRule])],
          cylinders: [isInteger, notFailingAsyncValidationRule],
        },
      },
      owner: {
        name: [isString, notFailingAsyncValidationRule],
        surname: [isString, notFailingAsyncValidationRule],
      },
    });

    return validateAsync(testValues)
      .then(errors => {
        Object.keys(errors).should.have.lengthOf(0);
      });
  });

  it('should populate errors object correctly when validation fails', () => {
    const validateAsync = createValidator({
      deal: [isString, failingAsyncValidationRule],
      car: {
        make: [oneOfArray(validMakes), notFailingAsyncValidationRule],
        model: [oneOfArray(validModels), notFailingAsyncValidationRule],
        engine: {
          displacement: [isInteger, oneOfRules([notFailingAsyncValidationRule, failingAsyncValidationRule])],
          cylinders: [isInteger, failingAsyncValidationRule],
        },
      },
      owner: {
        name: [isString, notFailingAsyncValidationRule],
        surname: [isString, notFailingAsyncValidationRule],
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
