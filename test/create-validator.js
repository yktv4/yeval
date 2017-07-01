'use strict';

require('should');
const _ = require('lodash');
const yeval = require('./../index');
const v = yeval.rules;

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
    const validateAsync = yeval.create({
      deal: [v.isString, notFailingAsyncValidationRule],
      car: {
        make: [v.oneOfArray(validMakes), notFailingAsyncValidationRule],
        model: [v.oneOfArray(validModels), notFailingAsyncValidationRule],
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
    const validateAsync = yeval.create({
      deal: [v.isString, failingAsyncValidationRule],
      car: {
        make: [v.oneOfArray(validMakes), notFailingAsyncValidationRule],
        model: [v.oneOfArray(validModels), notFailingAsyncValidationRule],
        engine: {
          displacement: [v.isInteger, v.oneOfRules([notFailingAsyncValidationRule, failingAsyncValidationRule])],
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
