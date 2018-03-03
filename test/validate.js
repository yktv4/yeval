'use strict';

const should = require('should');
const Promise = require('bluebird');
const _ = require('lodash');
const {
  validate,
  util: { oneOfRules, when, each },
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

  describe('handling of objects with enclosed properties', () => {
    it('should perform validation', () => {
      return validate(
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
      )
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

      return validate(
        {
          deal: isString,
          car: {
            make: [oneOfArray(validMakes), validateEnclosedObject],
            engine: {
              cylinders: validateEnclosedObject,
            },
          },
        },
        testValues
      )
        .then(errors => {
          should(errors).be.undefined();
          dealPropertyWasAvailable.should.be.true('"deal" property was not available');
        });
    });

    it('should pass the path to currently validated attribute as third argument', () => {
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

      return validate(
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
      )
        .then(errors => {
          should(errors).be.undefined();
        });
    });
  });

  it('should populate errors object correctly when validation fails', () => {
    const thisCaseTestValues = _.cloneDeep(testValues);
    delete thisCaseTestValues.car.engine.cylinders;
    delete thisCaseTestValues.deal;

    return validate(
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
    )
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

    return validate({ someName: [firstRule, secondRule] }, { someName: 'someValue' })
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

    return validate({ someName: [firstRule, secondRule] }, { someName: 'someValue' })
      .then(errors => {
        should(errors).be.an.Object();
        errors.should.have.property('someName');
        secondRuleWasExecuted.should.be.false();
      });
  });
});
