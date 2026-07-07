import { getFormatter } from './formatter-cache';

describe('getFormatter', () => {
	it('returns an Intl.NumberFormat', () => {
		expect(getFormatter()).toBeInstanceOf(Intl.NumberFormat);
	});

	it('returns the same instance for the same locale + format (cache hit)', () => {
		const a = getFormatter('en-US', { style: 'currency', currency: 'USD' });
		const b = getFormatter('en-US', { style: 'currency', currency: 'USD' });
		expect(a).toBe(b);
	});

	it('returns different instances for different format options', () => {
		const usd = getFormatter('en-US', { style: 'currency', currency: 'USD' });
		const eur = getFormatter('en-US', { style: 'currency', currency: 'EUR' });
		expect(usd).not.toBe(eur);
	});

	it('distinguishes by locale', () => {
		expect(getFormatter('en-US')).not.toBe(getFormatter('de-DE'));
	});

	it('formats according to the cached options', () => {
		const f = getFormatter('en-US', { style: 'currency', currency: 'USD' });
		expect(f.format(1234.5)).toBe('$1,234.50');
	});
});
