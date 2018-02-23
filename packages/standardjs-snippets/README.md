# Standard JavaScript Snippets for Atom

A collection of ES6 [standardjs code style](http://standardjs.com/) snippets for faster JavaScript development in [Atom Editor](https://atom.io/).

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

__Yes!, no semicolons:__
- [Are Semicolons Necessary in JavaScript?](https://www.youtube.com/watch?v=gsfbh17Ax9I)
- [An Open Letter to JavaScript Leaders Regarding Semicolons](http://blog.izs.me/post/2353458699/an-open-letter-to-javascript-leaders-regarding)
- [JavaScript Semicolon Insertion - Everything You Need to Know](http://inimino.org/~inimino/blog/javascript_semicolons)

## Installation

`apm install standardjs-snippets`

## Snippets

Snippets are optimized to be short and easy to remember. Some snippets are "chainable" and render differently when preceded by a "."

For example, `.fe` renders a chain-friendly version of the "forEach" snippet, while `fe` renders a full code block.

- [declarations](#declarations)
- [flow control](#flow-control)
- [functions](#functions)
- [iterables](#iterables)
- [objects and classes](#objects-and-classes)
- [returning values](#returning-values)
- [types](#types)
- [promises](#promises)
- [ES6 modules](#es6-modules)
- [testing](#testing)
- [console](#console)
- [timers](#timers)
- [DOM](#dom)
- [Node.js](#nodejs)
- [miscellaneous](#miscellaneous)

### Declarations

#### `v⇥` var statement
```js
var ${1:name}
```

#### `v=⇥` var assignment
```js
var ${1:name} = ${2:value}
```

#### `l⇥` let statement
```js
let ${1:name}
```

#### `l=⇥` let assignment
```js
let ${1:name} = ${2:value}
```

#### `lif=⇥` let declaration and if statement
```js
let ${1}
if (${0}) {
  ${1} = ${2}
}
```

#### `ly⇥` let yielded assignment
```js
let ${1:name} = yield ${2:value}
```

#### `c⇥` const statement
```js
const ${1:name}
```

#### `c=⇥` const assignment
```js
const ${1:name} = ${2:value}
```

#### `cy⇥` const yielded assignment
```js
const ${1:name} = yield ${2:value}
```

### Flow Control

#### `if⇥` if statement
```js
if (${1:condition}) {
  ${0}
}
```

#### `el⇥` else statement
```js
else {
  ${0}
}
```

#### `ife⇥` else statement
```js
if (${1:condition}) {
  ${0}
} else {

}
```

#### `ei⇥` else if statement
```js
else if (${1:condition}) {
  ${0}
}
```

#### `fl⇥` for loop (ES6)
```js
for (let ${1:i} = 0, ${2:len} = ${3:iterable}.length ${1:i} < ${2:len}; ${1:i}++) {
  ${0}
}
```

#### `fi⇥` for in loop (ES6)
```js
for (let ${1:key} in ${2:source}) {
  if (${2:source}.hasOwnProperty(${1:key})) {
    ${0}
  }
}
```

#### `fo⇥` for of loop (ES6)
```js
for (let ${1:key} of ${2:source}) {
  ${0}
}
```

#### `wl⇥` while loop
```js
while (${1:condition}) {
  ${0}
}
```

#### `tc⇥` try/catch
```js
try {
 ${0}
} catch (${1:err}) {

}
```

#### `tf⇥` try/finally
```js
try {
 ${0}
} finally {

}
```

#### `tcf⇥` try/catch/finally
```js
try {
  ${0}
} catch (${1:err}) {

} finally {

}
```

### Functions

#### `f⇥` anonymous function
```js
function (${1:arguments}) { ${0} }
```

#### `fn⇥` named function
```js
function ${1:name} (${2:arguments}) {
  ${0}
}
```

#### `asf⇥` async function
```js
async function (${1:arguments}) {
  ${0}
}
```

#### `iife⇥` immediately-invoked function expression (IIFE)
```js
;(function (${1:arguments}) {
  ${0}
})(${2})
```

#### `fa⇥` function apply
```js
${1:fn}.apply(${2:this}, ${3:arguments})
```

#### `fc⇥` function call
```js
${1:fn}.call(${2:this}, ${3:arguments})
```

#### `fb⇥` function bind
```js
${1:fn}.bind(${2:this}, ${3:arguments})
```

#### `af⇥` arrow function (ES6)
```js
(${1:arguments}) => ${2:statement}
```

#### `afb⇥` arrow function with body (ES6)
```js
(${1:arguments}) => {
  ${0}
}
```

#### `gf⇥` generator function (ES6)
```js
function* (${1:arguments}) {
  ${0}
}
```

#### `gfn⇥` named generator function (ES6)
```js
function* ${1:name}(${1:arguments}) {
  ${0}
}
```

#### `sf⇥` switch function based on object literals
```js
const ${1:name} = (${2:switching}) => ({
    ${3:case}: ${4:value},
  }[${2:switching}] || ${5:default value}
)
```

### Iterables

#### `fe⇥` forEach loop (chainable)
```js
${1:iterable}.forEach((${2:item}) => {
  ${0}
})
```

#### `map⇥` map function (chainable)
```js
${1:iterable}.map((${2:item}) => {
  ${0}
})
```

#### `reduce⇥` reduce function (chainable)
```js
${1:iterable}.reduce((${2:previous}, ${3:current}) => {
  ${0}
}${4:, initial})
```

#### `filter⇥` filter function (chainable)
```js
${1:iterable}.filter((${2:item}) => {
  ${0}
})
```

#### `find⇥` ES6 find function (chainable)
```js
${1:iterable}.find((${2:item}) => {
  ${0}
})
```

#### `every⇥` every function (chainable)
```js
${1:iterable}.every((${2:item}) => {
  ${0}
})
```

#### `some⇥` some function (chainable)
```js
${1:iterable}.some((${2:item}) => {
  ${0}
})
```

### Objects and classes

#### `cs⇥` class (ES6)
```js
class ${1:name} {
  constructor (${2:arguments}) {
    ${0}
  }
}
```

#### `csx⇥` child class (ES6)
```js
class ${1:name} extends ${2:base} {
  constructor (${2:arguments}) {
    super(${2:arguments})
    ${0}
  }
}
```

#### `:⇥` key/value pair
Javascript:
```js
${1:key}: ${2:'value'}
```
JSON:
```json
"${1:key}": ${2:"value"}
```

#### `m⇥` method (ES6 syntax)
```js
${1:method} (${2:arguments}) {
  ${0}
}
```

#### `get⇥` getter (ES6 syntax)
```js
get ${1:property}() {
  ${0}
}
```

#### `set⇥` setter (ES6 syntax)
```js
set ${1:property}(${2:value}) {
  ${0}
}
```

#### `gs⇥` getter and setter (ES6 syntax)
```js
get ${1:property}() {
  ${0}
}
set ${1:property}(${2:value}) {

}
```

#### `proto⇥` prototype method (chainable)
```js
${1:Class}.prototype.${2:methodName} = function (${3:arguments}) {
  ${0}
}
```

#### `ok` Object.keys
```js
Object.keys(${1:obj})
```

#### `oa` Object.assign
```js
Object.assign(${1:dest}, ${2:source})
```

### Returning values

#### `r⇥` return
```js
return ${0}
```

#### `rth⇥` return this
```js
return this
```

#### `rn⇥` return null
```js
return null
```

#### `rt⇥` return true
```js
return true
```

#### `rf⇥` return false
```js
return false
```

#### `r0⇥` return 0
```js
return 0
```

#### `r-1⇥` return -1
```js
return -1
```

#### `rp⇥` return Promise (ES6)
```js
return new Promise((resolve, reject) => {
  ${0}
})
```

### Types

#### `S⇥` String
#### `N⇥` Number
#### `O⇥` Object
#### `A⇥` Array
#### `D⇥` Date
#### `Rx⇥` RegExp

#### `tof⇥` typeof comparison
```js
typeof ${1:source} === '${2:undefined}'
```

#### `iof⇥` instanceof comparison
```js
${1:source} instanceof ${2:Object}
```

#### `ia⇥` isArray
```js
Array.isArray(${1:source})
```

### Promises

#### `p⇥` new Promise (ES6)
```js
new Promise((resolve, reject) => {
  ${0}
})
```

#### `then⇥` Promise.then (chainable)
```js
${1:promise}.then((${2:value}) => {
  ${0}
})
```

#### `catch⇥` Promise.catch (chainable)
```js
${1:promise}.catch((${2:err}) => {
  ${0}
})
```

### ES6 modules

#### `ex⇥` module export
```js
export ${1:member}
```

#### `exd⇥` module default export
```js
export default ${1:member}
```

#### `im⇥` module import
```js
import ${1:*} from '${2:module}'
```

#### `ima⇥` module import as
```js
import ${1:*} as ${2:name} from '${3:module}'
```

#### `imd⇥` module import destructuring
```js
import {$1} from '${2:module}'
```

### BDD testing (Mocha, Jasmine, etc.)

#### `desc⇥` describe
```js
describe('${1:description}', () => {
  ${0}
})
```
#### `its⇥` synchronous "it"
```js
it('${1:description}', () => {
  ${0}
})
```
#### `ita⇥` asynchronous "it"
```js
it('${1:description}', (done) => {
  ${0}
})
```

#### `bf⇥` before test suite
```js
before(() => {
  ${0}
})
```

#### `bfe⇥` before each test
```js
beforeEach(() => {
  ${0}
})
```

#### `aft⇥` after test suite
```js
after(() => {
  ${0}
})
```

#### `afe⇥` after each test
```js
afterEach(() => {
  ${0}
})
```

### Timers

#### `st⇥` setTimeout
```js
setTimeout(() => {
  ${0}
}, ${1:delay})
```

#### `si⇥` setInterval
```js
setTimeout(() => {
  ${0}
}, ${1:delay})
```

#### `sim⇥` setInterval
```js
setImmediate(() => {
  ${0}
})
```

### DOM

#### `ae⇥` addEventListener
```js
${1:document}.addEventListener('${2:event}', ${3:ev} => {
  ${0}
})
```

#### `rel⇥` removeEventListener
```js
${1:document}.removeEventListener('${2:event}', ${3:listener})
```

#### `gi⇥` getElementById
```js
${1:document}.getElementById('${2:id}')
```

#### `gc⇥` getElementsByClassName
```js
Array.from(${1:document}.getElementsByClassName('${2:class}'))
```

#### `gt⇥` getElementsByTagName
```js
Array.from(${1:document}.getElementsByTagName('${2:tag}'))
```

#### `qs⇥` querySelector
```js
${1:document}.querySelector('${2:selector}')
```

#### `qsa⇥` querySelectorAll
```js
Array.from(${1:document}.querySelectorAll('${2:selector}'))
```

### `cdf⇥` createDocumentFragment

```js
${1:document}.createDocumentFragment(${2:elem});
```

### `cel⇥` createElement

```js
${1:document}.createElement(${2:elem});
```

### `ac⇥` appendChild

```js
${1:document}.appendChild(${2:elem});
```

### `rc⇥` removeChild

```js
${1:document}.removeChild(${2:elem});
```

### `cla⇥` classList.add

```js
${1:document}.classList.add('${2:class}');
```

### `ct⇥` classList.toggle

```js
${1:document}.classList.toggle('${2:class}');
```

### `cr⇥` classList.remove

```js
${1:document}.classList.remove('${2:class}');
```

### `ga⇥` getAttribute

```js
${1:document}.getAttribute('${2:attr}');
```

### `sa⇥` setAttribute

```js
${1:document}.setAttribute('${2:attr}', ${3:value});
```

### `ra⇥` removeAttribute

```js
${1:document}.removeAttribute('${2:attr}');
```

### Node.js

#### `cb⇥` Node.js style callback
```js
function (err, ${1:value}) {
  if (err) throw err
  t${0}
}
```

#### `re⇥` require a module
```js
require('${1:module}')
```
#### `cre⇥` require and assign a module
```js
const ${1:module} = require('${1:module}')
```

#### `em⇥` export member
```js
exports.${1:name} = ${2:value}
```

#### `me⇥` module.exports
```js
module.exports = ${1:name}
```

#### `on⇥` attach an event handler (chainable)
```js
${1:emitter}.on('${2:event}', (${3:arguments}) => {
  ${0}
})
```

#### `xm⇥` Express middleware
```js
function (req, res${1:, next}) {
  ${0}
}
```

#### `xerr⇥` Express error handler
```js
function (err, req, res, next) {
  ${0}
}
```

### Miscellaneous

#### `us⇥` use strict
```js
'use strict'
```

#### `js⇥` JSON Stringify
```js
JSON.stringify($0)
```

#### `jp⇥` JSON Parse
```js
JSON.parse($0)
```

#### `a⇥` await
```js
await ${0}
```

### Console

#### `cl⇥` console.log
```js
console.log(${0})
```

#### `ce⇥` console.error
```js
console.error(${0})
```

#### `cw⇥` console.warn
```js
console.warn(${0})
```

## Commands

Use the following keymaps to speed up your development. You can quickly terminate lines with colons or manipulate blocks of code with ease.

#### End Line with a comma `CTRL-,`
Terminates the current line with a comma (great for object literals).

#### End New Line `CTRL-ENTER`
Terminates the current line with a colon followed with a new line. A comma is inserted when the cursor is inside an object literal.

#### Easy Blocks `CTRL-B`
Creates a statement block `{ ... }` with the selected text placed inside and properly indented. If the selection is already wrapped with a block, the block is removed and its content is unindented.

# Contributing
More than happy to accept external contributions to the project in the form of feedback, bug reports and even better pull requests.
Please read the [contributing guidelines](contributing.md)

# Related Repositories
- [Standard Linter](https://github.com/ricardofbarros/linter-js-standard)
- [Standard Formatter](https://github.com/maxogden/standard-format)

# Alternatives to Standard Style
- [Semistandard](https://github.com/Flet/semistandard) - standard, with semicolons
- [XO](https://github.com/sindresorhus/xo) - JavaScript happiness style, by Sindre Sorhus

# Author Info

Software engineer and consultant. I help companies develop software products and make technical decisions. I’m a proponent of devops, continuous delivery, lightweight agile methodologies and open source technology stacks.

I occasionally blog at [gaboesquivel.com](http://gaboesquivel.com) and you can find me on twitter as [@gaboesquivel](https://twitter.com/gaboesquivel)

# License

The MIT License (MIT)

Copyright (c) 2015, [Gabo Esquivel](http://gaboesquivel.com/about)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
