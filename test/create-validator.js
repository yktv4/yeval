'use strict';

const should = require('should');
const Promise = require('bluebird');
const _ = require('lodash');
const {
  createValidator,
  util: { oneOfRules, when, msgFor },
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
        should(errors).be.undefined();
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

    const firstRule = () => Promise.delay(100).then(() => {
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

  it('should stop execution of rules on first error by default', () => {
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

  describe('usage of when helper for enclosed objects', () => {
    it('should not execute enclosed object rules if predicate is false', () => {
      let validationOfCarWasPerformed = false;

      const validateCar = () => {
        validationOfCarWasPerformed = true;
        return Promise.resolve('Some error description');
      };
      const validateAsync = createValidator({
        deal: [isString],
        car: when(false, {
          make: [oneOfArray(validMakes), validateCar],
          model: [oneOfArray(validModels), validateCar],
          engine: {
            displacement: [isInteger, validateCar],
            cylinders: [isInteger, validateCar],
          },
        }),
        owner: {
          name: [isString, notFailingAsyncValidationRule],
          surname: [isString, notFailingAsyncValidationRule],
        },
      });

      return validateAsync(testValues)
        .then(errors => {
          should(errors).be.undefined();
          validationOfCarWasPerformed.should.be.false();
        });
    });

    it('should execute enclosed object rules if predicate is true', () => {
      const errorDescription = 'Some error description';
      let validationOfCarWasPerformed = false;

      const validateCar = () => {
        validationOfCarWasPerformed = true;
        return Promise.resolve(errorDescription);
      };
      const validateAsync = createValidator({
        deal: isString,
        car: when(true, {
          make: [oneOfArray(validMakes), validateCar],
          model: [oneOfArray(validModels), validateCar],
          engine: {
            displacement: [isInteger, validateCar],
            cylinders: [isInteger, validateCar],
          },
        }),
        owner: {
          name: [isString, notFailingAsyncValidationRule],
          surname: [isString, notFailingAsyncValidationRule],
        },
      });

      return validateAsync(testValues)
        .then(errors => {
          should(errors).be.Object();
          errors.should.containEql({
            car: {
              make: errorDescription,
              model: errorDescription,
              engine: {
                displacement: errorDescription,
                cylinders: errorDescription,
              },
            },
          });
          validationOfCarWasPerformed.should.be.true();
        });
    })
  });

  describe('usage of msgFor helper', () => {
    const customErrorMessage = 'Custom error message';

    it('should allow for async rules', () => {
      return createValidator({ make: msgFor(failingAsyncValidationRule, customErrorMessage) })({ make: 'some value' })
        .then(errors => {
          should(errors).be.an.Object();
          errors.make.should.be.a.String();
          errors.make.should.eql(customErrorMessage);
        });
    });

    it('should allow for enclosed objects', () => {
      return createValidator({ car: msgFor({ make: failingAsyncValidationRule }, customErrorMessage) })({ car: {} })
        .then(errors => {
          should(errors).be.an.Object();
          errors.car.should.be.a.String();
          errors.car.should.eql(customErrorMessage);
        });
    });
  });
});
