const cache = new Map<string, Intl.DateTimeFormat>();

export function getDateTimeFormat(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale ?? ''}::${stableOptions(options)}`;
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    cache.set(key, formatter);
  }
  return formatter;
}

function stableOptions(options: Intl.DateTimeFormatOptions): string {
  const keys = Object.keys(options).sort() as (keyof Intl.DateTimeFormatOptions)[];
  return keys.map((key) => `${key}:${String(options[key])}`).join('|');
}

export function clearIntlCache(): void {
  cache.clear();
}
