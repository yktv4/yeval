const should = require('should');
const {
  validate,
  util: {
    oneOfRules,
    when,
    msgFor,
    isDefined,
    each,
  },
  rules: {
    isString,
    isInteger,
    oneOfArray,
    minValue,
  },
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
    it('should not execute nested object rules if predicate is false', async () => {
      let validationOfCarWasPerformed = false;

      const validateCar = () => {
        validationOfCarWasPerformed = true;
        return Promise.resolve('Some error description');
      };
      const errors = await validate(
        {
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
        },
        testValues
      );

      should(errors).be.undefined();
      validationOfCarWasPerformed.should.be.false();
    });

    it('should execute nested object rules if predicate is true', async () => {
      const errorDescription = 'Some error description';
      let validationOfCarWasPerformed = false;

      const validateCar = () => {
        validationOfCarWasPerformed = true;
        return Promise.resolve(errorDescription);
      };
      const errors = await validate(
        {
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
        },
        testValues
      );

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

    it('should not execute any rules if promise is supplied that resolves with falsy value', async () => {
      const errors = await validate({ make: when(Promise.resolve(false), isString) }, { make: 123 });
      should(errors).be.undefined();
    });

    it('should pass whole data if `when` is applied within an nested object', async () => {
      let dealPropertyWasAvailable = true;
      const returnsTrue = (value, data) => {
        if (data.deal !== testValues.deal) {
          dealPropertyWasAvailable = false;
        }
        return true;
      };

      const errors = await validate(
        {
          deal: isString,
          car: when(returnsTrue, {
            make: when(returnsTrue, oneOfArray(validMakes)),
            engine: {
              cylinders: when(returnsTrue, isInteger),
            },
          }),
        },
        testValues
      );

      should(errors).be.undefined();
      dealPropertyWasAvailable.should.be.true('"deal" property was not available');
    });
  });

  describe('usage of msgFor util', () => {
    const customErrorMessage = 'Custom error message';

    it('should allow for async rules', async () => {
      const errors = await validate({ make: msgFor(failingAsyncValidationRule, customErrorMessage) }, { make: 'some value' });

      should(errors).be.an.Object();
      errors.make.should.be.a.String();
      errors.make.should.eql(customErrorMessage);
    });

    it('should allow for nested objects', async () => {
      const errors = await validate({ car: msgFor({ make: failingAsyncValidationRule }, customErrorMessage) }, { car: {} });

      should(errors).be.an.Object();
      errors.car.should.be.a.String();
      errors.car.should.eql(customErrorMessage);
    });

    it('should pass whole data if `msgFor` is applied within an nested object', async () => {
      const customErrorMessage = 'Custom error message';
      let dealPropertyWasAvailable = true;
      const notFailingRule = (value, data) => {
        if (data.deal !== testValues.deal) {
          dealPropertyWasAvailable = false;
        }
      };

      const errors = await validate(
        {
          deal: isString,
          car: msgFor({
            make: msgFor(notFailingRule, customErrorMessage),
            engine: {
              cylinders: msgFor(notFailingRule, customErrorMessage),
            },
          }, customErrorMessage),
        },
        testValues
      );

      should(errors).be.undefined();
      dealPropertyWasAvailable.should.be.true('"deal" property was not available');
    });
  });

  describe('usage of oneOfRules util', () => {
    it('should return the first error message if all rules have failed', async () => {
      const genericRule = oneOfRules([failingAsyncValidationRule, failingAsyncValidationRule]);

      const errors = await validate(
        {
          deal: [isString, genericRule],
          car: {
            engine: {
              displacement: [isInteger, genericRule],
            },
          },
          owner: {
            name: [isString, genericRule],
          },
        },
        testValues
      );

      should(errors).be.an.Object();
      should(errors).have.property('deal').String();
      should(errors).have.propertyByPath('car', 'engine', 'displacement').String();
      should(errors).have.propertyByPath('owner', 'name').String();
    });

    it('should return undefined if any rule has passed', async () => {
      const genericRule = oneOfRules([notFailingAsyncValidationRule, failingAsyncValidationRule]);

      const errors = await validate(
        {
          deal: [isString, genericRule],
          car: {
            engine: {
              displacement: [isInteger, genericRule],
            },
          },
          owner: {
            name: [isString, genericRule],
          },
        },
        testValues
      );

      should(errors).be.undefined();
    });
  });

  describe('usage of isDefined util', () => {
    it('should execute the rule if attribute is not undefined', async () => {
      let ruleWasExecuted = false;
      const optionalRule = () => {
        ruleWasExecuted = true;
      };

      await validate({ email: when(isDefined, optionalRule) }, { email: 123 });
      ruleWasExecuted.should.be.true();
    });

    it('should not execute the rule if attribute is undefined', async () => {
      let ruleWasExecuted = false;
      const optionalRule = () => {
        ruleWasExecuted = true;
      };
      const optionalRules = { email: when(isDefined, optionalRule) };

      await Promise.all([
        validate(optionalRules, { email: undefined }),
        validate(optionalRules, {}),
      ]);

      ruleWasExecuted.should.be.false();
    });
  });

  describe('usage of each util', () => {
    it('should return undefined in case no error is detected for any element', async () => {
      const errors = await validate({ tags: each([isInteger, minValue(6)]) }, { tags: [6, 7, 8] });
      should(errors).be.undefined();
    });

    it('should execute the rule for each array element', async () => {
      const errors = await validate({ tags: each([isInteger, minValue(6)]) }, { tags: [5, 6, 'car'] });

      should(errors).be.an.Object();
      should(errors.tags).be.an.Array();
      should(errors.tags[0]).be.a.String();
      should(errors.tags[1]).be.undefined();
      should(errors.tags[2]).be.a.String();
    });

    it('should execute the rule for each array element if each array element is an object', async () => {
      const testData = {
        timePeriods: [
          { start: '10:00:00', end: '13:00:00' },
          { start: 123, end: '17:00:00' },
          { start: '15:00:00', end: 123 },
        ],
      };

      const errors = await validate(
        {
          timePeriods: each({
            start: isString,
            end: isString,
          }),
        },
        testData
      );

      should(errors).be.an.Object();
      should(errors.timePeriods).be.an.Array();

      const [errorsForFirstTimePeriod, errorForSecondTimePeriod, errorForThirdTimePeriod] = errors.timePeriods;
      should(errorsForFirstTimePeriod).be.undefined();

      should(errorForSecondTimePeriod).be.an.Object();
      should(errorForSecondTimePeriod.start).be.a.String();
      should(errorForSecondTimePeriod.end).be.undefined();

      should(errorForThirdTimePeriod).be.an.Object();
      should(errorForThirdTimePeriod.start).be.undefined();
      should(errorForThirdTimePeriod.end).be.a.String();
    });
  });
});
