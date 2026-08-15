import { Instant } from '../core/instant.js';
import { nowMs } from '../clock.js';

export interface RelativeTimeOptions {
  readonly locale?: string;
  readonly numeric?: Intl.RelativeTimeFormatNumeric;
  readonly style?: Intl.RelativeTimeFormatStyle;
}

const rtfCache = new Map<string, Intl.RelativeTimeFormat>();

function getRtf(locale: string | undefined, options: RelativeTimeOptions): Intl.RelativeTimeFormat {
  const key = `${locale ?? ''}::${options.numeric ?? 'auto'}::${options.style ?? 'long'}`;
  let rtf = rtfCache.get(key);
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat(locale, {
      numeric: options.numeric ?? 'auto',
      style: options.style ?? 'long',
    });
    rtfCache.set(key, rtf);
  }
  return rtf;
}

export function relativeTime(
  from: Instant,
  to: Instant = Instant.ofEpochMillis(nowMs()),
  options: RelativeTimeOptions = {},
): string {
  const deltaMs = from.epochMillis - to.epochMillis;
  const abs = Math.abs(deltaMs);
  const rtf = getRtf(options.locale, options);
  const sec = Math.round(deltaMs / 1000);
  if (abs < 45_000) return rtf.format(sec, 'second');
  const min = Math.round(deltaMs / 60_000);
  if (abs < 45 * 60_000) return rtf.format(min, 'minute');
  const hour = Math.round(deltaMs / 3_600_000);
  if (abs < 22 * 3_600_000) return rtf.format(hour, 'hour');
  const day = Math.round(deltaMs / 86_400_000);
  if (abs < 26 * 86_400_000) return rtf.format(day, 'day');
  const month = Math.round(deltaMs / (30 * 86_400_000));
  if (abs < 320 * 86_400_000) return rtf.format(month, 'month');
  const year = Math.round(deltaMs / (365 * 86_400_000));
  return rtf.format(year, 'year');
}

export function fromNow(value: Instant, options: RelativeTimeOptions = {}): string {
  return relativeTime(value, Instant.ofEpochMillis(nowMs()), options);
}
