"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// @ts-ignore
const flatMap = tslib_1.__importStar(require("array.prototype.flatmap"));
// @ts-ignore
const ownKeys = tslib_1.__importStar(require("reflect.ownkeys"));
if (typeof Reflect.ownKeys === "undefined") {
    ownKeys.shim();
}
if (typeof Array.prototype.flatMap === "undefined") {
    flatMap.shim();
}
function extendStatics(derived, base) {
    for (const p of Reflect.ownKeys(base)) {
        if (p === "length" || p === "prototype" || p === "name") {
            continue;
        }
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(base, p)) {
            derived[p] = base[p];
        }
    }
}
function assign(target, ...args) {
    for (const arg of args) {
        for (const nextKey of Reflect.ownKeys(arg)) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(arg, nextKey)) {
                target[nextKey] = arg[nextKey];
            }
        }
    }
    return target;
}
function setPrototypeToProxy(self, baseClasses) {
    const proto = {};
    for (let i = baseClasses.length - 1; i >= 0; i--) {
        const basePrototype = baseClasses[i].prototype;
        extendStatics(self, baseClasses[i]);
        for (const nextKey of Reflect.ownKeys(basePrototype)) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(basePrototype, nextKey)) {
                const val = basePrototype[nextKey];
                // Only transfer functions
                if (typeof val === "function") {
                    // Make sure that the function is only called on the specific base.
                    // @ts-ignore
                    proto[nextKey] = function (...args) {
                        return val.apply(this.bases[i], args);
                    };
                }
            }
        }
    }
    proto.constructor = self;
    Object.freeze(proto);
    self.prototype = proto;
    return self;
}
/**
 * Returns a class which when "inherits" from all of the base classes.
 *
 * This function isolates the method calls on the bases, so if any of the 2 bases share a property or method with the same name then, they will not affect each other.
 *
 * When you access a property or method directly on `this` and not on `this.bases`, and it doesn't exist on the `this` instance, then the first base class with the method/property will be the one given precedence and its method/property will be the one given.
 *
 * The returned class must be initialized with the <i><b>instances</b></i> of each of the respective base classes
 *
 * Note: There is a caveat, setting properties is a bit fiddly, if you directly set a property in the constructor and the super class has the same property name then it will be overwritten.
 * This is not due to this library, this is due to the inherent dynamic nature of JavaScript.
 * But, this library isolates the derived and base classes, ie prevents collision of their properties and methods.
 * Thus, to solve this problem, it is recommended use the <code>defineProperties</code> method from this library.
 * @param baseClasses The base classes to be inherited.
 */
function bases(...baseClasses) {
    function Self(...baseInstances) {
        Reflect.defineProperty(this, 'bases', {
            configurable: false,
            enumerable: false,
            value: baseInstances,
            writable: false,
        });
        return new Proxy(this, {
            isExtensible(target) {
                return Reflect.isExtensible(target) && baseInstances.every(Reflect.isExtensible);
            },
            preventExtensions(target) {
                return Reflect.preventExtensions(target) && baseInstances.every(Reflect.preventExtensions);
            },
            getOwnPropertyDescriptor(target, p) {
                let pd = Reflect.getOwnPropertyDescriptor(target, p);
                for (const base of baseInstances) {
                    if (pd != null) {
                        break;
                    }
                    pd = Reflect.getOwnPropertyDescriptor(base, p);
                }
                return pd;
            },
            has(target, p) {
                return Reflect.has(target, p) || baseInstances.some(base => Reflect.has(base, p));
            },
            get(target, p) {
                if (p in target) {
                    // @ts-ignore
                    return target[p];
                }
                for (const base of baseInstances) {
                    if (p in base) {
                        // @ts-ignore
                        return base[p];
                    }
                }
                // @ts-ignore
                return target[p];
            },
            set(target, p, value) {
                if (p in target) {
                    // @ts-ignore
                    target[p] = value;
                    return true;
                }
                for (const base of baseInstances) {
                    if (p in base) {
                        // @ts-ignore
                        base[p] = value;
                        return true;
                    }
                }
                // @ts-ignore
                target[p] = value;
                return true;
            },
            deleteProperty(target, p) {
                if (p in target) {
                    return Reflect.deleteProperty(target, p);
                }
                for (const base of baseInstances) {
                    if (p in base) {
                        return Reflect.deleteProperty(base, p);
                    }
                }
                return Reflect.deleteProperty(target, p);
            },
            enumerate(target) {
                return Array.from(new Set(Reflect.ownKeys(target).concat(baseInstances.flatMap(Reflect.ownKeys))));
            },
            ownKeys(target) {
                return Array.from(new Set(Reflect.ownKeys(target).concat(baseInstances.flatMap(Reflect.ownKeys))));
            },
            // If you want to define a property then you certainly don't want it to be on the base class.
            defineProperty(target, p, attributes) {
                return Reflect.defineProperty(target, p, attributes);
            }
        });
    }
    setPrototypeToProxy(Self, baseClasses);
    return Self;
}
exports.bases = bases;
/**
 * Checks if the value `v` is an instance of the class `cls`.
 * This function takes into account the multiple base classes as well.
 *
 * @param v The value to check.
 * @param cls The constructor of the class.
 */
function isInstanceOf(v, cls) {
    if (v instanceof cls) {
        return true;
    }
    // @ts-ignore
    if ('bases' in v && Array.isArray(v.bases)) {
        // @ts-ignore
        for (const base of v.bases) {
            if (isInstanceOf(base, cls)) {
                return true;
            }
        }
    }
    return false;
}
exports.isInstanceOf = isInstanceOf;
/**
 * Defines the properties on the given object, the key represents the name of the property and the value as the, well, value.
 * Moreover, if the property name if prefixed with "readonly " then the property will be set to be readonly, ie non-writable.
 *
 * Use this function to set the properties of the objects inheriting from multiple base classes.
 *
 * @param v The object on which to define the properties
 * @param props A object with the keys as the property names and the values as the values of the properties.
 */
function defineProperties(v, props) {
    for (const prop of Reflect.ownKeys(props)) {
        if (typeof prop !== "string") {
            continue;
        }
        let propName = prop;
        let isWritable = true;
        if (prop.startsWith("readonly ")) {
            isWritable = false;
            propName = prop.slice(9);
        }
        Reflect.defineProperty(v, propName, {
            value: props[prop],
            writable: isWritable,
            configurable: true,
            enumerable: true,
        });
    }
}
exports.defineProperties = defineProperties;
//# sourceMappingURL=index.js.map