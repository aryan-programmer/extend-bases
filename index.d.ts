/**
 * The type of the constructor of an object.
 */
export declare type Ctor = new (...params: any[]) => any;
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
 * The type of an array containing the instances of specified constructors.
 */
export declare type InstancesArray<Ts extends Ctor[]> = {
    [I in keyof Ts]: Ts[I] extends Ctor ? InstanceType<Ts[I]> : never;
} & Array<InstanceType<Ts[number]>>;
/**
 * Specifies that the object has an array containing instances of all of the bases.
 */
export declare type HasBasesArray<TBases extends Ctor[]> = {
    readonly bases: InstancesArray<TBases>;
};
/**
 * Specifies that the object is an intersection of all of the bases.
 */
export declare type HasBases<TBases extends Ctor[]> = UnionToIntersection<AnyInstancesOf<TBases>> & HasBasesArray<TBases>;
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
export declare function bases<TBases extends Ctor[]>(...baseClasses: TBases): new (...baseInstances: InstancesArray<TBases>) => HasBases<TBases>;
/**
 * Checks if the value `v` is an instance of the class `cls`.
 * This function takes into account the multiple base classes as well.
 *
 * @param v The value to check.
 * @param cls The constructor of the class.
 */
export declare function isInstanceOf<T extends object, TBase extends Ctor>(v: T, cls: TBase): boolean;
/**
 * Defines the properties on the given object, the key represents the name of the property and the value as the, well, value.
 * Moreover, if the property name if prefixed with "readonly " then the property will be set to be readonly, ie non-writable.
 *
 * Use this function to set the properties of the objects inheriting from multiple base classes.
 *
 * @param v The object on which to define the properties
 * @param props A object with the keys as the property names and the values as the values of the properties.
 */
export declare function defineProperties<T extends object>(v: T, props: {
    [key: string]: any;
}): void;
export {};
