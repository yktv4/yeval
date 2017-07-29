- **isEmail**

Validates if an incoming string is a valid email.
Throws error if supplied value is not a string.
To avoid that, apply isString rule before applying this one.

Example of passing values: `notEmail@asd.asd`.

Example of failing values: `'notAnEmail', 'notEmail@', 'notEmail@asd'`.


- ***required***

Validates if incoming value is not `undefined`. Everything else except of `undefined` will pass.

Example of passing values: `null, '', 1, 1.1, {}, true, false, [], Function`.

Example of failing values: `undefined`.

- ***isArray***

Validates if incoming value is an `Array`. Relies on lodash's `_.isArray` method internally.

Example of passing values: `[]`.

Example of failing values: `undefined, null, '', 1, 1.1, {}, true, false, Function, Array`.

- ***isPlainObject***

Validates if incoming value is a plain object. Relies on lodash's `_.isPlainObject` method internally. 

Example of passing values: `{}`.

Example of failing values: `undefined, null, '', 1, 1.1, [], true, false, Object, Function`.

- ***minLength(min: number)***

Validates if `.length` property of a value is no less than `min` argument. 
Returns error if property `.length` of a value is not a `number`.
Throws if value can't have `.length` property (like `undefined`, `null`).

Example of passing values for `min=3`: `[1, 2, 3], [1, 2, 3, 4], 'asd', 'asdf'`.

Example of failing values for `min=3`: `[1, 2], 'as', ''`.

- ***maxLength(max: number)***

Validates if `.length` property of a value is no more than `max` argument. 
Returns error if property `.length` of a value is not a `number`.
Throws if value can't have `.length` property (like `undefined`, `null`).

Example of passing values for `max=3`: `[1, 2, 3], [1], 'asd', ''`.

Example of failing values for `max=3`: `[1, 2, 3, 4], 'asdf'`.

- ***minValue(min: number)***

Validates if value is no less than `min` argument. 
Converts value with `parseFloat` before comparison.
Compares with `<` operator.

Example of passing values for `min=1`: `1, 1.5, Infinity`.

Example of failing values for `min=1`: `0.999999999, 0, -Infinity, -1`.

- ***maxValue***

Validates if value is no more than `max` argument. 
Converts value with `parseFloat` before comparison.
Compares using `<` operator.

Example of passing values for `max=1`: `0.999999999, 0, -Infinity, -1`.

Example of failing values for `max=1`: `1.0000000001, 1.5, Infinity`.

- ***isInteger***

Validates if value is an integer.
Relies on lodash's `_.isInteger` method to determine that.

Example of passing values: `-100, -10, -1, 0, 1, 10, 100`.

Example of failing values: `undefined, null, '', 1.1, [], true, false, Object, Infinity, Function, Number`.


- ***isFloat***

Validates if value is a float.
Returns error if value is not a `number` or if it's an infinite number.
Relies on lodash's `_.isNumber` method to determine if value is a `number` before any further checks.

Example of passing values: `-100.01, -10.1, -1.2, 0.3, 1.4, 10.5, 100.6`.

Example of failing values: `undefined, null, '', 1, [], true, false, Object, Infinity, 1.0`.


- ***isNumber***

Example of passing values: `-100.01, -10.1, -1.2, 0.3, 1.4, 10.5, 100.6, -100, -10, -1, 0, 1, 10, 100, Infinity`.

Example of failing values: `undefined, null, '', [], true, false, Object, Function`.


- ***isBoolean***

Example of passing values: `true, false`.

Example of failing values: `undefined, null, 1, 1.01, '', [], {}, Boolean, Function`.


- ***isString***

Example of passing values: `'', 'asdasdasd'`.

Example of failing values: `undefined, null, 1, 1.01, true, false, [], Function, String`.


- ***oneOfArray(enumeration: array)***

Validates if value is present in an array passed as `enumeration` argument.
Uses `Array.prototype.indexOf` method to determine that.


- ***equals(toWhat: mixed)***

Validates if value is strictly equal to `toWhat` argument.
Relies on lodash's `_.isEqual` method internally.

- ***sameAs(fieldName: string)***

Validates if value is strictly equal to the value of another `fieldName`.
Relies on lodash's `_.isEqual` method internally.
