**IDEAS:**
1. break into separate files with 

# Ambi Coding Standard

Here are the recommended coding standards here at Ambi.

If you must deviate from them, be prepared to defend your choices during code review!

## Contents

- General Rules
  - Statements
  - End Of Line
  - Indenting
  - Commenting
  - Trailing Whitespace
  - Line Length
  - Crazy Train
- Scoping
  - Use Of Global Scope
  - Variables
  - Arrow Functions *
- Variables
  - Naming
  - Declarations
  - Objects &amp; Arrays
  - Type Checking
  - Instance Checking
  - Testing For Existence
- Conditionals
  - Testing For (In)Equality
  - Ternary Operator
- Strings
  - Quoting
  - Composition
- Classes
  - Getters &amp; Setters
  - Extending Prototypes
- Functions
  - Optimum Size *
  - Early Return *
  - Closures *
  - Nesting *
  - Chaining *
- Modules
  - Strict Mode
  - Requires At Top
  - Indenting
  - Standard Pattern
  - Commented-Out Code
  - Documentation
- Callbacks
  - Standard Pattern
  - Error Handling
- JSX
  - No Logic In JSX
- Code Quality
  - Linting
  - Unit Testing
  - Integration Testing

- Appendices
  - Standard Development Environment
  - Power Developer Toolkit
    - assert
    - lodash
    - json-safe-stringify




## &sect; General Rules

###  Statements

Use a semi-colon (;) to end statements

###  End Of Line (EOL)

End of line is defined as new-line ('\n')

###  Indenting

Use two spaces for every tab-stop.

#### Rationale

Using two space tab-stops can be easily visually discerned and improves readability without
sacrificing editing space.

Tabs do not belong in code because they can interfere with presentation and printing.

###  Comments

Use slash-style comments.

Comment the non-obvious, but no more than that.

#### Rationale

Block comments can interfere with documentation (See [Module/Documentation]())

Seasoned programmers know to only add comments when the purpose of the code isn't obvious.

Examples of non-obvious code would be code that has unexpected side-effects or is trying
to accomplish its goal using some *clever, clever means.*

Adding comments to obvious things clutters up the code, making it harder to read.

Here are some examples of superfluous commenting:

```js
for(let i=0; i<len; i++) { // iterate over the contents of the array
  ...
}

// set the type of the object
obj.type = 'foo';
```

###  Trailing Whitespace

Lines should not end with whitespace ('\s\t')

###  Crazy Train

Please do not use

- with
- eval
- Object.freeze
- Object.preventExtensions
- Object.seal

because they are profoundly evil and can damn you forever.

###  Line Length

Line length should never be greater than 120 characters.

#### Rationale

80-char lines print well using portrait mode, but landscape is best for code listings.

120-char lines print well using landscape mode.

## &sect; Scoping

###  Use Of Global Scope

Do not scope variables globally.

See [Scoping Rules](https://github.com/raisch/sandbox/blob/master/CODING.md#scoping-rules).

#### Rationale

**Why are globals considered dangerous?** (Extracted/edited from [hallettj/global-variables-are-bad.js](https://gist.github.com/hallettj/64478))

```js
// It is important to declare your variables.

(function() {
    var foo = 'Hello, world!';
    console.log(foo);  //=> Hello, world!
})();

console.log(foo);  //=> ERROR

// Because if you don't, they become global variables.

(function() {
    foo = 'Hello, world!';
    console.log(foo)  //=> Hello, world!
})();

console.log(foo)  //=> Hello, world!


// And when global variables sneak into your code they can cause problems,
// especially in applications with concurrency.

const printRange = function() {
    for (i = 0; i < 10; i += 1) { // i is either globally or module-scoped.
        console.log(i);
    }
};

printRange();  //=> 0 1 2 3 4 5 6 7 8 9

var eatUpRange = function() {
    for (i = 0; i < 10; i += 1) {
        // don't print anything;
    }
};

// Both loops increment i at the same time, which causes strange behavior.
window.setTimeout(eatUpRange, 10);
window.setTimeout(printRange, 10);  //=> 2 3 7 8 9 !!!
```

###  Variables

Know your scoping rules and scope all variables correctly.

- `global.i = 0` is globally scoped - (See [Use of Global Scope](https://github.com/raisch/sandbox/blob/master/CODING.md#use-of-global-scope))
- `i = 0` is module-scoped.
- `var i = 0` is function or module-scoped.
- `const i = 0` is block-scoped and ***IMMUTABLE*** or if declared outside of a block, module-scoped.
- `let i = 0` is block-scoped and ***MUTABLE***, or if declared outside of a block, module-scoped.

Correct
```js
function() { // correct
  let foo = true;
  const bar = false;

  foo = !foo;
}
```

Incorrect
```js
function() { // incorrect
  var foo = true; // foo is scoped to the module
  var bar = false;

  foo = !foo;
}
```

When in doubt, use `const`.

#### Rationale

Improperly scoped variables can cause a host of subtle, difficult to find bugs.

Since we have a lot of legacy code that uses the global object (which strict mode will not allow),
we prefer to refactor this:

```js
// producer.js
GLOBAL.FOO=true; // incorrect

// consumer.js
console.log(FOO);
```

into

```js
// producer.js
module.exports { // CORRECT
  FOO: true
};

// consumer.js
const { FOO } = require('./producer.js');

console.log(FOO);
```

###  Arrow Functions

```js
  // incorrect
  method() {
    const _this = this;
    obj.method(...args, function(err, res) {
      _this.reportError('...');
    })
  }

  // CORRECT
  method() {
    obj.method(...args, (err, res) => { // preserves value of this
      this.reportError('...');
    })
  }
```

## &sect; Variables

###  Naming

Use lowerCamelCase for variables, properties, arguments and function names.

Use UpperCamelCase for classes.

Use UPPERCASE for module-level constants.

Correct
```js
const SECONDS_PER_MINUTE = 60;
let varName = true;
const obj = {
  propertyName: false
};
function doSomething(firstArgument) { ... }
```

Incorrect
```js
const seconds_per_minute = 60;
let var_name = true;
const obj = {
  property_name: false
};
function do_something(first_argument) { ... }
```

###  Declarations

Use `let` or `const` to define variables, never `var`.

#### Rationale

Misusing variable declarations can inject subtle, difficult to find errors into your code.

Using `let` or `const` allows the JavaScript interpreter to help you write better code.

```js
// module.js
let foo = 1;
const bar = 1;

module.exports = {
  assignToLet: function() { return foo = 2; },
  assignToConst: function() { return bar = 2; }
}

// consumer
const m = require('./module.js');

> m.assignToLet() // => 2

> m.assignToConst() // throws TypeError: Assignment to constant variable.
```

Consider what would happen if we declared a variable we intended to be a constant using `let`,
and elsewhere in the code assigned a new value to it. *How would you locate this error?*

The typical approach would be to fire up the node debugger and set a watch on the variable but why
go through that bother when we could have just declared the variable correctly in the first place?

**NOTE:**

Q: Would you expect this

```js
const obj = { foo: true };
obj.bar = false;
```

to throw a `TypeError: Assignment to constant variable`?

A: You shouldn't because we are not reassigning the value associated with the symbol `obj`.

Rather we're setting properties within it, which doesn't reassign the value of `obj`.

When in doubt, use `const` to define everything you **know** should be immutable.

###  Objects &amp; Arrays

Declare objects using `{}` and array using `[]`.

Short declarations should be on the same line.

Remove trailing commas from object and array declarations.

Commas should be followed by one space.

Leading and trailing spacing should be consistent.

Correct
```js
const ary = [1, 2, 3]; // space after comma
const obj = { type:'foo' }; // consistent spacing
const bigObj = { // not a short declaration
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  f: 6,
  g: 7,
  h: 8,
  i: 9,
  j: 10 // no trailing comma
}
```

Incorrect
```js
const ary = new Array(1,2,3);
const obj = new Object({ type:'foo'}); // inconsistent spacing
const bigObj = {  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10, };
```

###  Type Checking

TBD

See [lodash]()

###  Instance Checking

When using the `instanceof` operator, the right operand must be a predefined class.

Comparing against an empty string or `null` will not work as you expect.

Correct
```js
if(foo instanceof MyClass) {
  ...
}
```

Incorrect
```js
if(foo instanceof '' || foo instanceof null) {
  ...
}
```

###  Testing For Existence

Use [lodash]()'s `isNil()` function to test the non-existence of a variable.

Invert (not) the result to test for existence.

Correct
```js
if(!_.isNil(foo)) {
  ...
}
```

Incorrect
```js
if(typeof foo !== 'undefined' && foo !== null) {
  ...
}
```

## &sect; Conditionals

###  Testing For (In)Equality

Always use the `===` and `!==` operators.

Correct
```js
if(foo === val)
if(foo !== val)
```

incorrect
```js
if(foo == val)
if(foo != val)
```

#### Rationale

The other equivalency operators (`==` and `!=`) *automagically* convert the type of
the left operand to equal that of the right operand.

Are these equivalent?

```js
1 == '1'; // YES because '1':String is converted to 1:Number and 1:Number == 1:Number
'1' == 1; // YES because 1:Number is converted to '1':String and '1':String == '1':String

1 === '1'; // NO because 1:Number is not equivalent to '1':String
'1' === 1; // NO because '1':String is not equivalent to 1:Number
```

Misuse of the equivalency operators can lead to subtle, difficult to locate errors
so you should never use `==` or `!=` *unless you __really__ understand what they do*.

###  Ternary Operator

Ternary operators (`condition ? consequent : alternate`) should never appear on a single line.

Each of the three parts should appear on separate lines.

If the condition includes comparison operators, it should be surrounded by parens.

And the operators and values for the consequent and alternate should be indented one tab-stop.

Correct
```js
const foo = resultOfTest
  ? true
  : false;

const result = (value === true)
  ? 1
  : -1;
```

Incorrect
```js
const foo = (resultOfTest) ? true : false;

const result = (value === true) ? 1 : -1;
```

## &sect; Strings

###  Quoting

Use single-quotes.

**NOTE:** *Unless you need to escape a single quote inside the string*
but even then, prefer `'quoted \'thing\' here'` over using double-quotes.

#### Rationale

Consistent quoting improves both readability and understandability.

**NOTE**: A lot of developers I know prefer code that can be read "with a glance" rather than
something they have to convert in their heads to a more understandable form. This is especially
critical when bug-hunting under time pressure. If everyone uses the same quoting style,
strings appear the same to everyone.

###  Composition

Use string templates rather than concatenation.

```js
var a = 'a';

var c = function() {
  return 'c';
};

var s = a + ' ' + 'b' + ' ' + c();  // incorrect
var s = `${a} b ${c()}`;            // correct
```

#### Rationale

The first (incorrect) form requires six operations:

1. set result to value of `a`
2. append ' ' to result
3. append 'b' to result
4. append ' ' to result
5. append the result of `c()` to result
6. assign result to `s`

and is harder to read.

While the second operation requires only three operations:

1. get value of `a`
2. get result of `c()`
3. assign result of evaluating template to `s`

and seems cluttered and harder to parse.

## &sect; Classes

###  Getters &amp; Setters

###  Extending Prototypes

Don't do it!

## &sect; Functions

###  Optimum Size

###  Early return

###  Closures

###  Nesting

###  Chaining

## &sect; Modules

###  Strict Mode

`use 'strict';` should be the first non-whitespace, non-comment line of all modules.

### Rationale

See [John Resig - ECMAScript 5 Strict Mode, JSON, and More](http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/).

**NOTE:** Strict mode will throw an error if you attempt to use the global object. See
[Use of Global Scope](https://github.com/raisch/sandbox/blob/master/CODING.md#use-of-global-scope)

###  Requires At Top

Add requirements at the top of the module.

###  Indenting

Maintain correct indenting at all times.

#### Rationale

Unnecessary indenting interferes with both navigation and understandability.

###  Standard Pattern

Define modules using standard patterns.

#### Rationale

Eight25's code makes heavy use of GLOBAL variables, which we know can cause problems and
reduce code quality.

Here is a typical example of a incorrect module pattern:

In `module.js`, we find:

```js
GLOBAL.ModuleType= {
  EVENT: 1,
  TODO: 2,
  TASK: 3
};
```

And either a class definition:

```js
export default class Module {
  constructor(opts) {
    this.innerProperty = true;
    this.type = ModuleType.EVENT;
  }

  getType() {
    return this.type;
  }

  setType(type) {
    this.type = type;
  }

  // or using a getter/setter which is VERY MUCH preferred

  get type() {
    return this.type;
  }

  set type(t) {
    this.type = t;
  }

}
```

or a mongoose model definition:

```js
const ModuleSchema = new Schema({
  type : {
      type : Number, /* 1- Event | 2 - To-Do | 3 - Task */
      default : null
  },
  innerProperty: { ... }
});

mongoose.model('Module', ModuleSchema);
```

So in `consumer.js`, we can either

```js
const Module = require('./module');
// -- or --
const Module = mongoose.model('Module');
```

and then:

```js
const mod = new Module;

if(mod.type === ModuleType.EVENT) { // from global scope!
  ...
}
```

A far better approach would be to follow this pattern: in `module.js` we find:

```js
const Types = {
  EVENT: 1,
  TODO: 2,
  TASK: 3
};
```

And either a class definition or mongoose model as above and then:

```js
Module.Types = Types; // static "class" property

module.exports = Module; // or export default class Module { ... }
```

So in `consumer.js`, we can

```js
const Module = require('./module');
const mod = new Module;

mod.type = Module.Types.EVENT; // using its setter
```

This is far a cleaner module pattern and does not rely on globals.

###  Commented-Out Code

Don't push code with sections that have been commented out.

#### Rationale

### Documentation

## &sect; Callbacks

###  Standard Pattern

Use the standard callback pattern.

If you must deviate from this, provide your reasoning in COPIOUS documentation.

#### Rationale

Every asynchronous function in node's standard library, as well as every mature,
well-written public-domain module follows this pattern which I think is reason
enough to follow. But further, if you plan on using your non-standard function in
a Promise, you won't be able to use any of the `promisify` modules to *automagically*
convert your function into a "thenable" (Promise).

```js
function(...args, cb) {
  obj.method(...args, (err, res) => {
    if(err) {
      cb(err);
      return;
    }
    cb(null,res);
  })
}
```

###  Callback Error Handling

## &sect; Code Quality

###  Linting

###  Unit Testing

###  Integration Testing

## Appendices

###  Standard Development Environment

##  Power Developer Toolkit

### assert

### lodash

### json-safe-stringify
