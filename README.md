# extend-bases: A simple library for multiple inheritance in JavaScript.

This library can be used to achieve multiple inheritance in JavaScript, but it sets itself apart from other libraries for multiple inheritance because it isolates the base classes and prevents the properties and methods from colliding, while still allowing easy access to the properties and methods of the base classes.

## Installation

Simply run:

```
npm add extend-bases
```

Or:

```
yarn add extend-bases
```

To import:

```typescript
import {bases, defineProperties, isInstanceOf} from "extend-bases";
```

Or:

```typescript
const {bases, defineProperties, isInstanceOf} = require("extend-bases");
```

## Getting started

To inherit from multiple bases simply extend from `bases(Class1, Class2, ...)`. In the constructor pass the <b>*instances*</b> of the classes to the `super` constructor.

Then you can access the base properties and methods directly from `this.`, the first class with that property or method will be given precedence. 

To access a particular base use `this.bases[index]`.

Replace all instances of `v instanceof Class` with `isInstanceOf(v, Class)`, it’s just that simple.

## For more details

- Read the [Handy manual](https://github.com/aryan-programmer/extend-bases/wiki/Handy-Manual), it’s very simple & small and gives enough information to get started.
- Then read the [Documentation](https://github.com/aryan-programmer/extend-bases/wiki/Documentation). it’s not too big and easy to go through.
- Then, if you have enough time or are interested, read the tests and source code of the project.

## Implementation details

This library uses Proxies, so sadly no IE11 support, but otherwise this library also imports es-shims for `Reflect.ownKeys`(ES6 but used very often and an es-shim exists for it) and `Array.prototype.flatMap`(ES2019, very new), which were found to be the bottlenecks, for some browsers.

This library uses proxies for easy access in the class instances, and it merges the prototypes of the base classes, but for isolation of base classes it creates a new function wrapping the method call. It’s just best to look at the source code for this.

## TypeScript support

The library is by default written in TypeScript, which you all should be using if you aren’t, for great code completion. The details of the TypeScript definitions are a bit fiddly, so it’s best not to worry about them, they work<small>, or you can just look at the source code</small>.

## Contributing

Feel free to open a pull request, fix bugs, or read the source code. It’s all up to you.