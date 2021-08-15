/**
 * The type of the constructor of an object.
 */
declare type Ctor = new (...params: any[]) => any;
declare type AnyInstancesOf<T extends Ctor[]> = InstanceType<T[number]>;
/**
 * Black magic.
 *
 * Note: Works only in one way.
 *
 * @internal
 */
declare type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
/**
 * Specifies that the array contains all the instances of specified constructors in order.
 */
declare type InstancesArray<Ts extends Ctor[]> = {
    [I in keyof Ts]: Ts[I] extends Ctor ? InstanceType<Ts[I]> : never;
} & Array<InstanceType<Ts[number]>>;
declare const SymbolBases: unique symbol;
/**
 * Specifies that the object has an array containing instances of all of the bases.
 */
declare type HasBasesArray<TBases extends Ctor[]> = {
    readonly [SymbolBases]: InstancesArray<TBases>;
};
/**
 * Specifies that the object is an intersection of all of the bases, and has an array containing all of the base instances.
 */
declare type HasBases<TBases extends Ctor[]> = UnionToIntersection<AnyInstancesOf<TBases>> & HasBasesArray<TBases>;
/**
 * Returns a class which when "inherits" from all of the base classes.
 *
 * This function isolates the method calls on the bases, so if any of the 2 bases share a property or method with the same name then, they will not affect each other.
 *
 * When you access a property or method directly on `this` and not on `this[SymbolBases]`, and it doesn't exist on the `this` instance, then the first base class with the method/property will be the one given precedence and its method/property will be the one given.
 *
 * The returned class must be initialized with the <i><b>instances</b></i> of each of the respective base classes
 *
 * Note: There is a caveat in setting properties, if you directly set a property in the constructor and the super class has the same property name then it will be overwritten, and the super class will refer to the same property, and things may break.
 * This is not due to this library, this is due to the inherent dynamic nature of JavaScript.
 * But, this library isolates the derived and base classes, ie prevents collision of their properties and methods.
 * Thus, this problem can be avoided by using the <code>defineProperties</code> method from this library, if you use the <code>[SymbolBases]</code> methods as well.
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
 *         // To get a specific base use `this[SymbolBases][index]` where index is the index of the base as given in the bases function.
 *         return `Gotten: ${this[SymbolBases][0].get()} ${this[SymbolBases][1].get()}`
 *     }
 * }
 *
 * const n = new NewClass();
 * console.log(n.val); // true: The base given first is given preference.
 * console.log(n.get()); // true: The base given first is given preference, of course.
 * n.add(10);
 * n.deactivate();
 * console.log(n.val, n[SymbolBases][1].val); // false 10: The [SymbolBases] are isolated, one can't affect the other, not directly that is.
 */
declare function bases<TBases extends Ctor[]>(...baseClasses: TBases): new (...baseInstances: InstancesArray<TBases>) => HasBases<TBases>;
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
declare function defineProperties<T extends object>(v: T, props: {
    [key: string]: any;
}): void;
/**
 * Checks if the value `v` is an instance of the class `cls`.
 * This function takes into account the multiple base classes.
 *
 * @param v The object to check.
 * @param cls The constructor of the class to check.
 * @return Whether or not the object `v` is an instance of the given class `cls`.
 */
declare function isInstanceOf<T extends object, TBase extends Ctor>(v: T, cls: TBase): boolean;
export { Ctor, InstancesArray, HasBasesArray, HasBases, bases, defineProperties, isInstanceOf, SymbolBases };
