/* tslint:disable:only-arrow-functions */
// Let’s first declare some classes, and import the required methods:
import {bases, defineProperties, isInstanceOf} from "..";
import { SymbolBases } from '../index';

describe("Multiple Inheritance", function () {
	describe("bases(...)", function () {
		class A {
			static v = 1;
			a = 'A.a';
			b = 'A.b';

			get () {
				return 'A.get()';
			}

			aGet () {
				return 'A.aGet()';
			}

			getB_A () {
				return this.b;
			}

			setB_A (b: string) {
				this.b = b;
			}
		}

		class B {
			b = 'B.b';
			c = 'B.c';

			get (): string {
				return 'B.get()';
			}

			getVal (): string {
				return 'B.getVal()';
			}

			getB_B () {
				return this.b;
			}

			setB_B (b: string) {
				this.b = b;
			}
		}

		class C {
			c = 'C.c';

			getVal (): string {
				return 'C.getVal()';
			}

			getC (): string {
				return this.c;
			}
		}

		class D extends bases(C, B, A) {
			constructor () {
				super(
					new C(),
					new B(),
					new A(),
				)
			}

			getC () {
				return this[SymbolBases][0].getC() + "@D";
			}
		}

		let d: D = new D();
		beforeEach(function () {
			d = new D();
		});

		it('should allow us to get the properties of the mixins directly', function () {
			expect(d.a).toBe('A.a');
		});

		it('should allow us to call the methods of the mixins directly', function () {
			expect(d.aGet()).toBe('A.aGet()');
		});

		it('should isolate the method calls of the mixins', function () {
			expect(d.getB_A()).toBe('A.b');
			expect(d.getB_B()).toBe('B.b');
			d.setB_A('A.b new');
			expect(d.getB_A()).toBe('A.b new');
			expect(d.getB_B()).toBe('B.b');
			d.setB_B('B.b new2');
			expect(d.getB_A()).toBe('A.b new');
			expect(d.getB_B()).toBe('B.b new2');
		});

		it('should give preference to the mixin given earlier in the arguments array', function () {
			expect(d.b).toBe('B.b');
			expect(d.get()).toBe('B.get()');

			expect(d.c).toBe('C.c');
			expect(d.getVal()).toBe('C.getVal()');
		});

		it('should allow us to override methods in the derived class', function () {
			expect(d.getC()).toBe("C.c@D");
			expect(d[SymbolBases][0].getC()).toBe("C.c");
		});

		it('should allow us the get the mixins individually using .bases', function () {
			const base = d[SymbolBases][1];
			const b = base.b;
			expect(b).toBe(d.getB_B());
			expect(b).toBe(base.getB_B());
			expect(base).toBeInstanceOf(B);
		});

		it('should have the expected side effects', function () {
			// Both are side effect of the way the library isolates method calls of different bases.
			expect(d[SymbolBases][0].getVal).not.toBe(d.getVal);
			/**
			 * ignore check C
			 */
			expect(d).not.toBeInstanceOf(B);
		});

		it('should return the name of all of the properties of the bases and the class on calling Object.keys', function () {
			expect(Object.keys(d).sort()).toStrictEqual(['a', 'b', 'c']);
		});
	});
	describe("isInstanceOf(...)", function () {
		// tslint:disable:class-name
		class A {
			constructor () {
			}
		}

		class B_A extends A {
			constructor () {
				super();
			}
		}

		class B {
			constructor () {
			}
		}

		class C__BA_B extends bases(B_A, B) {
			constructor () {
				super(new B_A(), new B());
			}
		}

		class C__B extends B {
			constructor () {
				super();
			}
		}

		class D__CBAB_CB extends bases(C__BA_B, C__B) {
			constructor () {
				super(new C__BA_B(), new C__B());
			}
		}

		class D__CB extends C__B {
			constructor () {
				super();
			}
		}

		class E__DCBABCB extends D__CBAB_CB {
			constructor () {
				super();
			}
		}

		class E__DCB extends D__CB {
			constructor () {
				super();
			}
		}

		// tslint:enable:class-name

		let d1 = new D__CBAB_CB();
		let d2 = new D__CB();
		let e1 = new E__DCBABCB();
		let e2 = new E__DCB();
		beforeEach(function () {
			d1 = new D__CBAB_CB();
			d2 = new D__CB();
			e1 = new E__DCBABCB();
			e2 = new E__DCB();
		});

		it('should return `true` if the class is anywhere in the base proxy or prototype chain', function () {
			expect(isInstanceOf(d1, C__BA_B)).toBe(true);
			expect(isInstanceOf(d1, C__B)).toBe(true);
			expect(isInstanceOf(d1, B)).toBe(true);
			expect(isInstanceOf(d1, B_A)).toBe(true);
			expect(isInstanceOf(d1, A)).toBe(true);

			expect(isInstanceOf(d2, C__B)).toBe(true);
			expect(isInstanceOf(d2, B)).toBe(true);

			expect(isInstanceOf(e1, D__CBAB_CB)).toBe(true);
			expect(isInstanceOf(e1, C__BA_B)).toBe(true);
			expect(isInstanceOf(e1, C__B)).toBe(true);
			expect(isInstanceOf(e1, B)).toBe(true);
			expect(isInstanceOf(e1, B_A)).toBe(true);
			expect(isInstanceOf(e1, A)).toBe(true);

			expect(isInstanceOf(e2, D__CB)).toBe(true);
			expect(isInstanceOf(e2, C__B)).toBe(true);
			expect(isInstanceOf(e2, B)).toBe(true);
		});

		it('should not give false positives', function () {
			expect(isInstanceOf(d2, C__BA_B)).toBe(false);
			expect(isInstanceOf(d2, B_A)).toBe(false);
			expect(isInstanceOf(d2, A)).toBe(false);

			expect(isInstanceOf(e2, D__CBAB_CB)).toBe(false);
			expect(isInstanceOf(e2, C__BA_B)).toBe(false);
			expect(isInstanceOf(e2, B_A)).toBe(false);
			expect(isInstanceOf(e2, A)).toBe(false);
		});

		it('should return true if the object is a direct instance of the class', function () {
			expect(isInstanceOf(d1, D__CBAB_CB)).toBe(true);
			expect(isInstanceOf(d2, D__CB)).toBe(true);
			expect(isInstanceOf(e1, E__DCBABCB)).toBe(true);
			expect(isInstanceOf(e2, E__DCB)).toBe(true);
		});
	});
	describe("defineProperties(...)", function () {
		class A {
			a = "A.a";
		}

		class B {
			b = "B.b";
		}

		class C extends bases(A, B) {
			a: string;
			b = "C.b";
			c: string;

			constructor () {
				super(
					new A(),
					new B()
				);
				defineProperties(this, {
					a: "C.a",
					"readonly c": "C.c"
				});
				this.b = "C.b";
			}
		}

		let c = new C();
		beforeEach(function () {
			c = new C();
		});

		it('should not change the properties of the bases', function () {
			expect(c.a).toBe("C.a");
			expect(c[SymbolBases][0].a).toBe("A.a");
		});

		it('the normal method should overwrite the property', function () {
			expect(c.b).toBe(c[SymbolBases][1].b);
			expect(c.b).toBe("C.b");
		});

		it('should not allow us to overwrite the readonly properties', function () {
			expect(c.c).toBe("C.c");
			expect(() => {
				c.c = "C.changed"
			}).toThrowError(TypeError);
			expect(c.c).toBe("C.c");
		});

		it('should allow us to overwrite the non-readonly properties, but not affect the properties of the bases', function () {
			expect(c.a).toBe("C.a");
			c.a = "C.altered";
			expect(c.a).toBe("C.altered");
			expect(c[SymbolBases][0].a).toBe("A.a");
		});

		it('setting the properties not created by `defineProperties` should set them on the base', function () {
			expect(c.b).toBe("C.b");
			c.b = "C.botched";
			expect(c.b).toBe("C.botched");
			expect(c[SymbolBases][1].b).toBe("C.botched");
		});
	});
});
