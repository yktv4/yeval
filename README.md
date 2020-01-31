# yeval
[![<yktv4>](https://img.shields.io/circleci/build/gh/yktv4/yeval)](<https://circleci.com/gh/yktv4/yeval>)

Dead simple JavaScript schema validation.

### Example

```javascript
// Require the main `validate` function and the rules you'll need
const {
  validate,
  rules: {
    isString,
    minLength,
    sameAs,
  },
} = require('yeval');

// Run the `validate` function with the rules against the target object to get the errors object
const errors = await validate(
  {
    userName: [isString, minLength(1)],
    password: [isString, minLength(6)],
    repeatPassword: [isString, minLength(6), sameAs('password')],
  },
  {
    userName: 'Mark',
    password: 'somePassword',
    repeatPassword: 'someOtherPassword',
  }
);

console.log(errors); // { repeatPassword: 'Must match password' }
```

### Concept

Any validation rule is a function that returns an error string in case validation fails. Any validation function is provided with three arguments:

- `value` -- value of an attribute this rule is declared for
- `data` -- the whole object that is being validated
- `path` -- path in `data` to currently validated value

Here's the simplest validation rule possible:

```javascript
const required = value => {
  if (!value) {
    return 'Required';
  }
};

// Let's apply our rule against a null value:
const error = required(null);
console.log(error); // we get a string 'Required' as a result
```
Yeval is just a tool that runs such validation functions for you and allows to combine them in an eloquent fashion!

### Some aspects

- `yeval` is Promise-based meaning `validate` function always returns a Promise. Even for synchronous rules.
- Successful validation resolves with `undefined`.
- Failed validation resolves with a plain object that contains error string for every attribute that failed
a validation.
- Rejection of promise occurs only on runtime errors.
- `yeval` returns only the first error for each object's attribute.
- Validation of the next object's attribute will start only after the previous attribute was validated.
- Rules for each attribute are executed from left to right. Each next rule waits until the previous one finishes. Even if rule is asynchronous.
- All built-in rules assume value is of proper type for that rule. Build your validation rules list in order of
increasing strictness. i.e. validating `null` against `isEmail` would result in runtime error since `isEmail`
assumes value is a string. Proper validation for this case is `[isString, isEmail]`.

### More examples

- Conditional validation

Use `when` to build conditions whether to apply any validation rules.

```javascript
const {
  validate,
  util: {
    when,
  },
  rules: {
    isBoolean,
    isEmail,
  },
} = require('yeval');

const optedInForNewsletter = (value, data) => data.optedInForNewsletter === true;

const errors = await validate(
  {
    optedInForNewsletter: isBoolean,
    email: when(optedInForNewsletter, isEmail),
  },
  {
    optedInForNewsletter: true,
  }
);

console.log(errors);  // { email: 'Must be a valid email address' }
```

- Custom validation rules

Writing your own validation rules in the simplest way possible. Just define a function.

```javascript
const {
  validate,
  rules: {
    isEmail,
  },
} = require('yeval');

const isGmailAccount = (value) => {
  if (value.slice(-9) !== 'gmail.com') {
    return 'Sorry, we only accept gmail accounts';
  }
};

const errors = await validate(
  {
    email: [isEmail, isGmailAccount],
  },
  {
    email: 'jesus@christ.com',
  }
);

console.log(errors); // { email: 'Sorry, we only accept gmail accounts' }
```

- Custom error messages

Use `msgFor` for custom error messages if rule fails.

```javascript
const {
  validate,
  util: {
    msgFor,
  },
  rules: {
    isEmail,
  },
} = require('yeval');

const errors = await validate(
  {
    email: msgFor(isEmail, 'We need your email address. We really do.'),
  },
  {
  email: 'notAnEmail',
  }
);

console.log(errors); // { email: 'We need your email address. We really do.' }
```

- Validation of nested objects

Supply an object as a rule for an attribute if you want to validate nested object

```javascript
const {
  validate,
  rules: {
    isString,
    oneOfArray,
  },
} = require('yeval');

const errors = await validate(
  {
    car: {
      make: [isString, oneOfArray(['BMW', 'Mercedes', 'Audi'])],
    },
  },
  {
    car: {
      make: 'Boeing',
    },
  }
);

console.log(errors); // { car: { make: 'Must be one of: BMW, Mercedes, Audi' } }
```

- Async validation

Any validation rule can be a promise that resolves with an error string in case of failure.

```javascript
const {
  validate,
  rules: {
    isEmail,
  },
} = require('yeval');

const isUniqueEmail = (value) => {
  return User.where({ email: value }).exists().then(exists => {
    if (exists) {
      return 'Email you supplied is already registered';
    }
  });
};

const errors = await validate(
  {
    email: [isEmail, isUniqueEmail],
  },
  {
    email: 'already.existing@email.com',
  }
);

console.log(errors); // { email: 'Email you supplied is already registered' }
```

- Optional validation

All built-in rules assume the value is defined by default. So to optionally apply any rule you can use `when(isDefined, rule)` construction.

```javascript
const {
  validate,
  util: {
    when,
    isDefined,
  },
  rules: {
    isString,
    isEmail,
  },
} = require('yeval');

const errors = await validate(
  {
    email: when(isDefined, [isString, isEmail]),
  },
  {}
);

console.log(errors); // undefined
```

- Compose rules in any way you need.

Since rule is just a function you can easily compose them in no particular order.

```javascript
const {
  validate,
  util: {
    when,
    isDefined,
    msgFor,
  },
  rules: {
    isString,
    isEmail,
    oneOfArray,
  }
} = require('yeval');

const validAudiModels = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
const isAudi = (value, data) => data.car.make === 'Audi';

const errors = await validate(
  {
    email: when(isDefined, [msgFor(isString, 'Hey, we need a string!'), isEmail]),
    car: when(isDefined, {
      make: isString,
      model: when(isAudi, msgFor(oneOfArray(validAudiModels), 'This is not a valid audi model!')),
    }),
  },
  {
    email: 'speedy@gonzales.com',
    car: {
      make: 'Audi',
      model: 'A3',
    },
  }
);

console.log(errors); // undefined
```

### Docs
Docs are available [here](https://github.com/yktv4/yeval/blob/master/docs).

### License ([MIT](https://github.com/yktv4/yeval/blob/master/LICENSE))