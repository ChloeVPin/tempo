import { TempoError } from '../errors.js';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from '../core/range.js';
import { parseOffsetToken } from '../core/instant.js';

export function formatOffset(offsetMs: number, style: 'short' | 'iso' | 'basic' = 'iso'): string {
  const sign = offsetMs >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMs);
  const hours = Math.floor(abs / MILLIS_PER_HOUR);
  const minutes = Math.floor((abs % MILLIS_PER_HOUR) / MILLIS_PER_MINUTE);
  const seconds = Math.floor((abs % MILLIS_PER_MINUTE) / MILLIS_PER_SECOND);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (style === 'short' && minutes === 0 && seconds === 0) return `${sign}${hh}`;
  if (style === 'basic') {
    return seconds === 0 ? `${sign}${hh}${mm}` : `${sign}${hh}${mm}${ss}`;
  }
  return seconds === 0 ? `${sign}${hh}:${mm}` : `${sign}${hh}:${mm}:${ss}`;
}

export function parseOffset(input: string): number {
  const ms = parseOffsetToken(input);
  if (ms === null) {
    throw new TempoError('INVALID_OFFSET', `Invalid UTC offset ${input}`, { input });
  }
  return ms;
}

export function isFixedOffsetId(id: string): boolean {
  return id === 'UTC' || id === 'GMT' || parseOffsetToken(id) !== null;
}

export function offsetMsFromId(id: string): number | null {
  if (id === 'UTC' || id === 'GMT') return 0;
  return parseOffsetToken(id);
}
