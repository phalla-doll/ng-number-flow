import type { Format, Value } from 'number-flow/lite';

type FormatterKey = string;

const cache = new Map<FormatterKey, Intl.NumberFormat>();

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

export function formatterKey(locales?: Intl.LocalesArgument, format?: Format): string {
	return `${locales ? JSON.stringify(locales) : ''}:${format ? JSON.stringify(format) : ''}`;
}

export type { Value, Format };
