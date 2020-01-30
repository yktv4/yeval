const should = require('should');
const bluebird = require('bluebird');
const _ = require('lodash');
const {
  validate,
  util: { oneOfRules, each },
  rules: { isString, isInteger, oneOfArray }
} = require('./../index');

describe('Behavior of validate function', () => {
  const testValues = {
    deal: 'purchase',
    car: {
      make: 'BMW',
      model: '5-er',
      engine: {
        displacement: 4,
        cylinders: 6,
      },
      availableColors: [
        { name: 'black', hex: '000' },
        { name: 'white', hex: 'fff' }
      ],
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

  describe('handling of nested objects', () => {
    it('should perform validation', async () => {
      const errors = await validate(
        {
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
        },
        testValues
      );

      should(errors).be.undefined();
    });

    it('should return error if anything else is found instead of nested object', async () => {
      const errors = await validate(
        {
          notDefinedProperty: {
            someKey: isString,
          },
          car: {
            notDefinedProperty: {
              someKey: isString,
            }
          }
        },
        testValues
      );

      should(errors).containEql({
        notDefinedProperty: 'Property notDefinedProperty must be an object',
        car: {
          notDefinedProperty: 'Property car.notDefinedProperty must be an object',
        }
      });
    });

    it('should pass the whole form data as second argument', async () => {
      let dealPropertyWasAvailable = true;
      const validateNestedObject = (value, data) => {
        if (data.deal !== testValues.deal) {
          dealPropertyWasAvailable = false;
        }
      };

      const errors = await validate(
        {
          deal: isString,
          car: {
            make: [oneOfArray(validMakes), validateNestedObject],
            engine: {
              cylinders: validateNestedObject,
            },
          },
        },
        testValues
      );

      should(errors).be.undefined();
      dealPropertyWasAvailable.should.be.true('"deal" property was not available');
    });

    it('should pass the path to currently validated attribute as third argument', async () => {
      const pathShouldBe = expectedPath => (value, data, path) => {
        if (!_.isEqual(path, expectedPath)) {
          return `Path should be ${expectedPath} while in fact it is ${path}`;
        }
      };
      let pathForAvailableColorsCounter = 0;
      const pathInArrayShouldBe = (pathToArray, pathInArrayElement) => (value, data, path) => {
        const expectedPathInArray = pathToArray
          .concat([pathForAvailableColorsCounter.toString()])
          .concat(pathInArrayElement);
        pathForAvailableColorsCounter++;
        if (!_.isEqual(path, expectedPathInArray)) {
          return `Path should be ${expectedPathInArray} while in fact it is ${path}`;
        }
      };

      const errors = await validate(
        {
          deal: pathShouldBe(['deal']),
          car: {
            make: pathShouldBe(['car', 'make']),
            model: pathShouldBe(['car', 'model']),
            engine: {
              displacement: pathShouldBe(['car', 'engine', 'displacement']),
              cylinders: pathShouldBe(['car', 'engine', 'cylinders']),
            },
            availableColors: each({
              hex: [isString, pathInArrayShouldBe(['car', 'availableColors'], ['hex'])]
            })
          },
          owner: {
            name: pathShouldBe(['owner', 'name']),
            surname: pathShouldBe(['owner', 'surname']),
          },
        },
        testValues
      );

      should(errors).be.undefined();
    });
  });

  it('should populate errors object correctly when validation fails', async () => {
    const thisCaseTestValues = _.cloneDeep(testValues);
    delete thisCaseTestValues.car.engine.cylinders;
    delete thisCaseTestValues.deal;

    const errors = await validate(
      {
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
      },
      thisCaseTestValues
    );

    should(errors).be.an.Object();
    Object.keys(errors).should.have.lengthOf(2);

    errors.car.engine.cylinders.should.be.a.String();
    errors.deal.should.be.a.String();
  });

  it('should perform a validation of an attribute in series by default', async () => {
    let firstRuleWasExecuted = false;
    let secondRuleWasExecutedAfterFirst = false;

    const firstRule = () => bluebird.delay(20).then(() => {
      firstRuleWasExecuted = true;
      return Promise.resolve();
    });
    const secondRule = () => Promise.resolve().then(() => {
      if (firstRuleWasExecuted) {
        secondRuleWasExecutedAfterFirst = true;
      }
      return Promise.resolve();
    });

    const errors = await validate({ someName: [firstRule, secondRule] }, { someName: 'someValue' });

    should(errors).be.undefined();
    secondRuleWasExecutedAfterFirst.should.be.true();
  });

  it('should stop execution of rules for attribute on first error by default', async () => {
    let secondRuleWasExecuted = false;

    const firstRule = () => Promise.resolve('Some error description');
    const secondRule = () => {
      secondRuleWasExecuted = true;
      return Promise.resolve();
    };

    const errors = await validate({ someName: [firstRule, secondRule] }, { someName: 'someValue' });

    should(errors).be.an.Object();
    errors.should.have.property('someName');
    secondRuleWasExecuted.should.be.false();
  });
});
