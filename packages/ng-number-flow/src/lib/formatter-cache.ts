import type { Format, Value } from 'number-flow/lite';

const cache = new Map<string, Intl.NumberFormat>();

export function getFormatter(
	locales?: Intl.LocalesArgument,
	format?: Format
): Intl.NumberFormat {
	const key = `${locales ? JSON.stringify(locales) : ''}:${format ? JSON.stringify(format) : ''}`;
	let formatter = cache.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locales, format);
		cache.set(key, formatter);
	}
	return formatter;
}

export type { Format, Value };
