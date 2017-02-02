# yeval

Dead simple JavaScript schema validation.

### Example

```javascript
import yeval from 'yeval';
const {
  required,
  isString,
  minLength,
  maxLength,
  matches,
  when,
  isBoolean,
  email,
  msgFor
} = yeval.rules;

const optedInForNewsletter = (value, data) => data.optedInForNewsletter === true;

const validate = yeval.create.validator({
  userName: [required, isString, minLength(1)],
  password: [required, isString, minLength(6)],
  repeatPassword: [required, isString, matches('password')],
  optedInForNewsletter: isBoolean,
  email: when(optedInForNewsletter, msgFor(email, 'Please provide email to opt in for a newsletter')),
});

const errors = validate({
  userName: 'Mark',
  password: 'somePassword',
  repeatPassword: 'someOtherPassword',
  optedInForNewsletter: true,
});

console.log(errors);
// { repeatPassword: 'Must match password', email: 'Please provide email to opt in for a newsletter' }

```

### Concept

Any validation rule is a function that returns an error string in case validation fails. Any validation function is provided with two arguments:

- `value` -- value of an attribute this rule function is declared for
- `data` -- the whole object that is being validated

Here's the simplest validation function possible:

```javascript
const required = value => {
  if (!value) {
    return 'Required';
  }
};
```

### Usage

- Import the library and the rules you'll need:
```javascript
import yeval from 'yeval';
const { required, isString, minLength } = yeval.rules;
 ```
- Define a set of validation rules and pass it to `yeval.create.validator` to get a `validate` function.
```javascript
const validate = yeval.create.validator({
  name: [required, isString, minLength(1)]
});
```
- Run the `validate` function against the target object to get the `errors` object.
```javascript
const errors = validate({ name: 'Danny' });
console.log(errors);
// {}
```


### API
You can see the list of available rules [here](https://github.com/yktv4/yeval/blob/master/src/rules.js).

### License ([MIT](https://github.com/yktv4/yeval/blob/master/LICENSE))