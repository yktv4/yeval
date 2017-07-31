'use strict';

const should = require('should');
const Promise = require('bluebird');
const _ = require('lodash');
const {
  createValidator,
  util: { oneOfRules, when, msgFor, isDefined },
  rules: { isString, isInteger, oneOfArray }
} = require('./../index');

describe('Util functions', () => {
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
  const genericErrorMessage = 'Some error';

  const notFailingAsyncValidationRule = () => Promise.resolve();
  const failingAsyncValidationRule = () => Promise.resolve(genericErrorMessage);

  const validMakes = ['BMW', 'Mercedes', 'Audi'];
  const validModels = ['3-er', '5-er', '7-er'];

  describe('usage of when util', () => {
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
    });

    it('should not execute any rules if promise is supplied that resolves with falsy value', () => {
      return createValidator({ make: when(Promise.resolve(false), isString) })({ make: 123 })
        .then(errors => {
          should(errors).be.undefined();
        });
    });

    it('should pass whole data if `when` is applied within an enclosed object', () => {
      let dealPropertyWasAvailable = true;
      const returnsTrue = (value, data) => {
        if (data.deal !== testValues.deal) {
          dealPropertyWasAvailable = false;
        }
        return true;
      };

      const validateAsync = createValidator({
        deal: isString,
        car: when(returnsTrue, {
          make: when(returnsTrue, oneOfArray(validMakes)),
          engine: {
            cylinders: when(returnsTrue, isInteger),
          },
        }),
      });

      return validateAsync(testValues)
        .then(errors => {
          should(errors).be.undefined();
          dealPropertyWasAvailable.should.be.true('"deal" property was not available');
        });
    });
  });

  describe('usage of msgFor util', () => {
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

    it('should pass whole data if `msgFor` is applied within an enclosed object', () => {
      const customErrorMessage = 'Custom error message';
      let dealPropertyWasAvailable = true;
      const notFailingRule = (value, data) => {
        if (data.deal !== testValues.deal) {
          dealPropertyWasAvailable = false;
        }
      };

      const validateAsync = createValidator({
        deal: isString,
        car: msgFor({
          make: msgFor(notFailingRule, customErrorMessage),
          engine: {
            cylinders: msgFor(notFailingRule, customErrorMessage),
          },
        }, customErrorMessage),
      });

      return validateAsync(testValues)
        .then(errors => {
          should(errors).be.undefined();
          dealPropertyWasAvailable.should.be.true('"deal" property was not available');
        });
    });
  });

  describe('usage of oneOfRules util', () => {
    it('should return the first error message if all rules have failed', () => {
      const genericRule = oneOfRules([failingAsyncValidationRule, failingAsyncValidationRule]);
      const validate = createValidator({
        deal: [isString, genericRule],
        car: {
          engine: {
            displacement: [isInteger, genericRule],
          },
        },
        owner: {
          name: [isString, genericRule],
        },
      });

      return validate(testValues)
        .then(errors => {
          should(errors).be.an.Object();
          should(errors).have.property('deal').String();
          should(errors).have.propertyByPath('car', 'engine', 'displacement').String();
          should(errors).have.propertyByPath('owner', 'name').String();
        });
    });

    it('should return undefined if any rule has passed', () => {
      const genericRule = oneOfRules([notFailingAsyncValidationRule, failingAsyncValidationRule]);
      const validate = createValidator({
        deal: [isString, genericRule],
        car: {
          engine: {
            displacement: [isInteger, genericRule],
          },
        },
        owner: {
          name: [isString, genericRule],
        },
      });

      return validate(testValues)
        .then(errors => {
          should(errors).be.an.undefined();
        });
    });
  });

  describe('usage of isDefined util', () => {
    it('should execute the rule if attribute is not undefined', () => {
      let ruleWasExecuted = false;
      const optionalRule = () => {
        ruleWasExecuted = true;
      };
      const validate = createValidator({
        email: when(isDefined, optionalRule),
      });

      return validate({ email: 123 })
        .then(() => {
          ruleWasExecuted.should.be.true();
        });
    });

    it('should not execute the rule if attribute is undefined', () => {
      let ruleWasExecuted = false;
      const optionalRule = () => {
        ruleWasExecuted = true;
      };
      const validate = createValidator({
        email: when(isDefined, optionalRule),
      });

      Promise.all([
        validate({ email: undefined }),
        validate({}),
      ])
        .then(() => {
          ruleWasExecuted.should.be.false();
        });
    });
  });
});
