# yeval

Dead simple JavaScript schema validation.

### Example

```javascript
// Require the createValidator function and the rules you'll need
const { createValidator, rules: { isString, minLength, sameAs } } = require('yeval');

// Define a set of validation rules and pass it to createValidator to get a validate function
const validate = createValidator({
  userName: [isString, minLength(1)],
  password: [isString, minLength(6)],
  repeatPassword: [isString, minLength(6), sameAs('password')],
});

// Run the validate function against the target object to get the errors object
validate({
  userName: 'Mark',
  password: 'somePassword',
  repeatPassword: 'someOtherPassword',
}).then(errors => {
  console.log(errors);
  // { repeatPassword: 'Must match password' }
});
```

### Concept

Any validation rule is a function that returns an error string in case validation fails. Any validation function is provided with two arguments:

- `value` -- value of an attribute this rule is declared for
- `data` -- the whole object that is being validated

Here's the simplest validation function possible:

```javascript
const required = value => {
  if (!value) {
    return 'Required';
  }
};
```

### Some aspects

- `yeval` is Promise-based meaning `validate` function always returns a Promise. Even for synchronous rules.
- Successful validation resolves with `undefined`.
- Failed validation resolves with a plain object that contains error string for every attribute that failed
a validation.
- Rejection of promise occurs only on runtime errors. 
- Attributes are validated from top to bottom. Those declared first in the validation rules object get validated first.
- Rules for each attribute are executed from left to right. Regardless if they are asynchronous or not.
- Validation for attribute stops after first failing rule. Error message for that rule is returned as error for
this attribute.
- All built-in rules assume value is of proper type for that rule. Build your validation rules list in order of
increasing strictness. i.e. validating `null` against `isEmail` would result in runtime error since `isEmail`
assumes value is a string. Proper validation for this case is `[isString, isEmail]`.

### More examples

- Conditional validation

Use `when` to build conditions whether to apply any validation rules.

```javascript
const { createValidator, util: { when }, rules: { isBoolean, isEmail } } = require('yeval');

const optedInForNewsletter = (value, data) => data.optedInForNewsletter === true;

const validate = createValidator({
  optedInForNewsletter: isBoolean,
  email: when(optedInForNewsletter, isEmail),
});

validate({ optedInForNewsletter: true }).then(errors => {
  console.log(errors);
  // { email: 'Must be a valid email address' }
});
```

- Custom validation rules

Writing your own validation rules in the simplest way possible. Just define a function.

```javascript
const { createValidator, rules: { isEmail } } = require('yeval');

const isGmailAccount = (value) => {
  if (value.slice(-9) !== 'gmail.com') {
    return 'Sorry, we only accept gmail accounts';
  }
};

const validate = createValidator({
  email: [isEmail, isGmailAccount],
});

validate({ email: 'jesus@christ.com' }).then(errors => {
  console.log(errors);
  // { email: 'Sorry, we only accept gmail accounts' }
});
```

- Custom error messages

Use `msgFor` for custom error messages if rule fails.

```javascript
const { createValidator, util: { msgFor }, rules: { isEmail } } = require('yeval');

const validate = createValidator({
  email: msgFor(isEmail, 'We need your email address. We really do.'),
});

validate({ email: 'notAnEmail' }).then(errors => {
  console.log(errors);
  // { email: 'We need your email address. We really do.' }
});
```

- Validation of enclosed objects

Supply an object as a rule for a property if you want to validate enclosed object

```javascript
const { createValidator, rules: { isString, oneOfArray } } = require('yeval');

const validate = createValidator({
  car: {
    make: [isString, oneOfArray(['BMW', 'Mercedes', 'Audi'])]
  },
});

validate({ car: { make: 'Boeing' } }).then(errors => {
  console.log(errors);
  // { car: { make: 'Must be one of: BMW, Mercedes, Audi' } }
});
```

- Async validation

Any validation rule can be a promise that resolves with an error string in case of failure.

```javascript
const { createValidator, util: { when }, rules: { isString, isEmail } } = require('yeval');
const isUniqueEmail = (value) => {
  return User.where({ email: value }).exists().then(exists => {
    if (exists) {
      return 'Email you supplied is already registered';
    }
  });
};

const validate = createValidator({
  email: [isEmail, isUniqueEmail],
});

validate({ email: 'already.existing@email.com' }).then(errors => {
  console.log(errors);
  // { car: { make: 'Email you supplied is already registered' } }
});
```

- Optional validation

All built-in rules assume the value is defined by default. So to optionally apply any rule you can use `when(isDefined, rule)` construction.

```javascript
const { createValidator, util: { when, isDefined }, rules: { isString, isEmail } } = require('yeval');

const validate = createValidator({
  email: when(isDefined, [isString, isEmail]),
});

validate({}).then(errors => {
  console.log(errors);
  // undefined
});
```

- Compose rules in any way you need.

Since rule is just a function you can easily compose them in no particular order.

```javascript
const {
  createValidator,
  util: { when, isDefined, msgFor },
  rules: { isString, isEmail, oneOfArray }
} = require('yeval');

const validAudiModels = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
const isAudi = (value, data) => data.car.make === 'Audi';

const validate = createValidator({
  email: when(isDefined, [msgFor(isString, 'Hey, we need a string!'), isEmail]),
  car: when(isDefined, {
    make: isString,
    model: when(isAudi, msgFor(oneOfArray(validAudiModels), 'This is not a valid audi model!')),
  }),
});

validate({
  email: 'speedy@gonzales.com',
  car: {
    make: 'Audi',
    model: 'A3',
  },
}).then(errors => {
  console.log(errors);
  // undefined
});
```

### Docs
Docs are available [here](https://github.com/yktv4/yeval/blob/master/docs).

### License ([MIT](https://github.com/yktv4/yeval/blob/master/LICENSE))