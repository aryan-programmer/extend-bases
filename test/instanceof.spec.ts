import { basename, extname } from 'path';
import { bases, isInstanceOf, SymbolBases } from '../index';

test(`first one class`, () =>
{
	const baseClasses = [TypeError, Array] as const;

	class D extends bases(...baseClasses)
	{
		constructor()
		{
			super(
				new TypeError(),
				new Array(),
			)
		}

		getC()
		{
			return this[SymbolBases][0].name + "@D";
		}
	}

	let actual = new D();
	let expected = baseClasses[0];

	expect(actual).toBeInstanceOf(expected);

	baseClasses.forEach(c => expect(isInstanceOf(actual, c)).toBeTruthy());

	expect(actual).toBeInstanceOf(Error);
	expect(isInstanceOf(actual, Error)).toBeTruthy();

});
