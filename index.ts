// @ts-ignore
import * as flatMap from "array.prototype.flatmap";
// @ts-ignore
import * as ownKeys from "reflect.ownkeys";

if (typeof Reflect.ownKeys === "undefined") {
	ownKeys.shim();
}

if (typeof Array.prototype.flatMap === "undefined") {
	flatMap.shim();
}

function onlyUnique<T> (value: T, index: number, self: T[]) {
	return self.indexOf(value) === index;
}

/**
 * The type of the constructor of an object.
 */
type Ctor = new(...params: any[]) => any;

type AnyInstancesOf<T extends Ctor[]> = InstanceType<T[number]>;

/**
 * Black magic.
 *
 * Note: Works only in one way.
 *
 * @internal
 */
type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/**
 * Specifies that the array contains all the instances of specified constructors in order.
 */
type InstancesArray<Ts extends Ctor[]> = {
	[I in keyof Ts]: Ts[I] extends Ctor ? InstanceType<Ts[I]> : never;
} & Array<InstanceType<Ts[number]>>;

/**
 * Specifies that the object has an array containing instances of all of the bases.
 */
type HasBasesArray<TBases extends Ctor[]> = {
	readonly bases: InstancesArray<TBases>
}

/**
 * Specifies that the object is an intersection of all of the bases, and has an array containing all of the base instances.
 */
type HasBases<TBases extends Ctor[]> =
	UnionToIntersection<AnyInstancesOf<TBases>> &
	HasBasesArray<TBases>;

function extendStatics (derived: any, base: any): any {
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

function setPrototypeToProxy<TBases extends Ctor[]> (
	self: (...args: any[]) => void,
	baseClasses: TBases
) {
	const proto = {};
	for (let i = baseClasses.length - 1; i >= 0; i--) {
		const basePrototype = baseClasses[i].prototype;
		extendStatics(self, baseClasses[i]);
		for (const nextKey of Reflect.ownKeys(basePrototype)) {
			// Avoid bugs when hasOwnProperty is shadowed
			if (Object.prototype.hasOwnProperty.call(basePrototype, nextKey)) {
				const val = basePrototype[nextKey];
				// Only transfer functions
				if (nextKey !== "constructor" && typeof val === "function") {
					// Make sure that the function is only called on the specific base.
					// @ts-ignore
					proto[nextKey] = function (this: HasBases<TBases>, ...args: any[]): any {
						return val.apply(this.bases[i], args);
					};
				}
			}
		}
	}
	proto.constructor = self;
	Object.freeze(proto);
	self.prototype = proto;
	return self as unknown as new() => object;
}

/**
 * Returns a class which when "inherits" from all of the base classes.
 *
 * This function isolates the method calls on the bases, so if any of the 2 bases share a property or method with the same name then, they will not affect each other.
 *
 * When you access a property or method directly on `this` and not on `this.bases`, and it doesn't exist on the `this` instance, then the first base class with the method/property will be the one given precedence and its method/property will be the one executed.
 *
 * The returned class must be initialized with the <i><b>instances</b></i> of each of the respective base classes
 *
 * Note: There is a caveat in setting properties, if you directly set a property in the constructor and the super class has the same property name then it will be overwritten, and the super class will refer to the same property, and things may break.
 * This is not due to this library, this is due to the inherent dynamic nature of JavaScript.
 * But, this library isolates the derived and base classes, ie prevents collision of their properties and methods.
 * Thus, this problem can be avoided by using the <code>defineProperties</code> method from this library, if you use the <code>bases</code> methods as well.
 * @param baseClasses The base classes to be inherited.
 * @return A constructor taking in the *instances* of the base classes.
 *
 * @example
 * class Activatable {
 *     val: boolean;
 *
 *     constructor (val: boolean) {
 *         this.val = val;
 *     }
 *
 *     activate () {
 *         this.val = true;
 *     }
 *
 *     deactivate () {
 *         this.val = false;
 *     }
 *
 *     get (): boolean {
 *         return this.val;
 *     }
 * }
 *
 * class Accumulator {
 *     val: number;
 *
 *     constructor (result: number) {
 *         this.val = result;
 *     }
 *
 *     add (val: number) {
 *         this.val += val;
 *     }
 *
 *     get (): number {
 *         return this.val;
 *     }
 * }
 *
 * // Now let’s declare a new class inheriting from both of the classes:
 * class NewClass extends bases(Activatable, Accumulator) {
 *     constructor () {
 *         // To initialize the bases create a new instance of them and pass them to the constructor of the super class, now you will no longer need the `super` keyword.
 *         super(
 *             new Activatable(true),
 *             new Accumulator(0),
 *         );
 *     }
 *
 *     getBoth () {
 *         // To get a specific base use `this.base[index]` where index is the index of the base as given in the bases function.
 *         return `Gotten: ${this.bases[0].get()} ${this.bases[1].get()}`
 *     }
 * }
 *
 * const n = new NewClass();
 * console.log(n.val); // true: The base given first is given preference.
 * console.log(n.get()); // true: The base given first is given preference, of course.
 * n.add(10);
 * n.deactivate();
 * console.log(n.val, n.bases[1].val); // false 10: The bases are isolated, one can't affect the other, not directly that is.
 */
function bases<TBases extends Ctor[]> (...baseClasses: TBases):
	new (...baseInstances: InstancesArray<TBases>) => HasBases<TBases> {
	type BaseInstances = InstancesArray<TBases>;
	type Self = HasBases<TBases>;

	function Self (this: Self, ...baseInstances: BaseInstances) {
		Reflect.defineProperty(this, 'bases', {
			configurable: false,
			enumerable: false,
			value: baseInstances,
			writable: false,
		});
		return new Proxy(this, {
			isExtensible (target: Self): boolean {
				return Reflect.isExtensible(target) && baseInstances.every(Reflect.isExtensible);
			},
			preventExtensions (target: Self): boolean {
				return Reflect.preventExtensions(target) && baseInstances.every(Reflect.preventExtensions);
			},
			getOwnPropertyDescriptor (target: Self, p: string | number | symbol): PropertyDescriptor | undefined {
				let pd: PropertyDescriptor | undefined = Reflect.getOwnPropertyDescriptor(target, p);
				for (const base of baseInstances) {
					if (pd != null) {
						break;
					}
					pd = Reflect.getOwnPropertyDescriptor(base, p);
				}
				return pd;
			},
			has (target: Self, p: string | number | symbol): boolean {
				return Reflect.has(target, p) || baseInstances.some(base => Reflect.has(base, p));
			},
			get (target: Self, p: string | number | symbol): any {
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
			set (target: Self, p: string | number | symbol, value: any): boolean {
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
			deleteProperty (target: Self, p: string | number | symbol): boolean {
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
			ownKeys (target: Self): (string | symbol)[] {
				return Reflect.ownKeys(target).concat(baseInstances.flatMap(Reflect.ownKeys)).filter(onlyUnique);
			},
			// If you want to define a property then you certainly don't want it to be on the base class.
			defineProperty (target: Self, p: PropertyKey, attributes: PropertyDescriptor): boolean {
				return Reflect.defineProperty(target, p, attributes);
			}
		});
	}

	setPrototypeToProxy(Self, baseClasses);

	return Self as unknown as new(...baseInstances: BaseInstances) => HasBases<TBases>;
}

/**
 * Defines the properties on the given object, the key represents the name of the property and the value as the, well, value.
 * Moreover, if the property name if prefixed with `readonly` then the property will be set to be readonly, ie non-writable, ie any attempts to edit it in strict mode will fail with a `TypeError`.
 *
 * Use this function to set the properties of the objects inheriting from multiple base classes.
 *
 * @param v The object on which to define the properties
 * @param props A object with the keys as the property names and the values as the values of the properties.
 *
 * @example
 * // In the constructor
 * defineProperties(this, {
 *     <prop>: <value>, // Define a property on `this` with the name <prop> and value <value>
 *     "readonly <>": <value>, // Define a readonly property on `this` with the name <prop> and value <value>, readonly ie any attempts to edit it in strict mode will fail with a TypeError.
 * });
 */
function defineProperties<T extends object> (v: T, props: { [key: string]: any }) {
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
		})
	}
}

/**
 * Checks if the value `v` is an instance of the class `cls`.
 * This function takes into account the multiple base classes.
 *
 * @param v The object to check.
 * @param cls The constructor of the class to check.
 * @return Whether or not the object `v` is an instance of the given class `cls`.
 */
function isInstanceOf<T extends object, TBase extends Ctor> (v: T, cls: TBase): boolean {
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

export {Ctor, InstancesArray, HasBasesArray, HasBases, bases, defineProperties, isInstanceOf}
