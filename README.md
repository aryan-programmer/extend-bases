# extend-bases: A simple library for multiple inheritance in JavaScript.

This library can be used to achieve multiple inheritance in JavaScript, but it sets itself apart from other libraries for multiple inheritance because it isolates the base classes and prevents the properties and methods from colliding, while still allowing easy access to the properties and methods of the base classes.

## Implementation details

This library uses Proxies, so sadly no IE11 support, but otherwise this library also imports es-shims for `Reflect.ownKeys`(ES6 but used very often and an es-shim exists for it) and `Array.prototype.flatMap`(ES2019, very new), which were found to be the bottlenecks, for some browsers.

This library uses proxies for easy access in the class instances, and it merges the prototypes of the base classes, but for isolation of base classes it creates a new function wrapping the method call. It’s just best to look at the source code for this.

## TypeScript support

The library is by default written in TypeScript, which you all should be using if you aren’t, for great code completion. The details of the TypeScript definitions are a bit fiddly, so it’s best not to worry about them, they work<small>, or you can just look at the source code</small>.
