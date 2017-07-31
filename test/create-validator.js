'use strict';

const should = require('should');
const Promise = require('bluebird');
const _ = require('lodash');
const {
  createValidator,
  util: { oneOfRules, when },
  rules: { isString, isInteger, oneOfArray }
} = require('./../index');

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

  describe('handling of objects with enclosed properties', () => {
    it('should perform validation', () => {
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
          should(errors).be.undefined();
        });
    });

    it('should pass the whole form data as second argument', () => {
      let dealPropertyWasAvailable = true;
      const validateEnclosedObject = (value, data) => {
        if (data.deal !== testValues.deal) {
          dealPropertyWasAvailable = false;
        }
      };

      const validateAsync = createValidator({
        deal: isString,
        car: {
          make: [oneOfArray(validMakes), validateEnclosedObject],
          engine: {
            cylinders: validateEnclosedObject,
          },
        },
      });

      return validateAsync(testValues)
        .then(errors => {
          should(errors).be.undefined();
          dealPropertyWasAvailable.should.be.true('"deal" property was not available');
        });
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
        should(errors).be.an.Object();
        Object.keys(errors).should.have.lengthOf(2);

        errors.car.engine.cylinders.should.be.a.String();
        errors.deal.should.be.a.String();
      });
  });

  it('should perform a validation of an attribute in series by default', () => {
    let firstRuleWasExecuted = false;
    let secondRuleWasExecutedAfterFirst = false;

    const firstRule = () => Promise.delay(20).then(() => {
      firstRuleWasExecuted = true;
      return Promise.resolve();
    });
    const secondRule = () => Promise.resolve().then(() => {
      if (firstRuleWasExecuted) {
        secondRuleWasExecutedAfterFirst = true;
      }
      return Promise.resolve();
    });

    return createValidator({ someName: [firstRule, secondRule] })({ someName: 'someValue' })
      .then(errors => {
        should(errors).be.undefined();
        secondRuleWasExecutedAfterFirst.should.be.true();
      });
  });

  it('should stop execution of rules for attribute on first error by default', () => {
    let secondRuleWasExecuted = false;

    const firstRule = () => Promise.resolve('Some error description');
    const secondRule = () => {
      secondRuleWasExecuted = true;
      return Promise.resolve();
    };

    return createValidator({ someName: [firstRule, secondRule] })({ someName: 'someValue' })
      .then(errors => {
        should(errors).be.an.Object();
        errors.should.have.property('someName');
        secondRuleWasExecuted.should.be.false();
      });
  });
});
