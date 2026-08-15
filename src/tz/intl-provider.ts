import { TempoError } from '../errors.js';
import { utcMillis } from '../core/instant.js';
import type { LocalDateTime } from '../core/local-datetime.js';
import { MILLIS_PER_HOUR } from '../core/range.js';
import { offsetMsFromId } from './offset.js';
import type { TimeZoneProvider } from './types.js';

const formatterCache = new Map<string, Intl.DateTimeFormat>();
const unknownZones = new Set<string>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let cached = formatterCache.get(timeZone);
  if (cached) return cached;
  try {
    cached = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      era: 'short',
    });
    cached.format(new Date(0));
  } catch (err) {
    unknownZones.add(timeZone);
    throw new TempoError('UNKNOWN_TIMEZONE', `Unknown time zone ${timeZone}`, {
      input: timeZone,
      cause: err,
    });
  }
  formatterCache.set(timeZone, cached);
  return cached;
}

interface CivilParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function readParts(epochMs: number, timeZone: string): CivilParts {
  const parts = formatter(timeZone).formatToParts(new Date(epochMs));
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  let year = Number(map.year);
  const era = (map.era ?? '').toUpperCase();
  if (era.startsWith('B')) year = 1 - year;
  const hourRaw = map.hour === '24' ? 0 : Number(map.hour);
  return {
    year,
    month: Number(map.month),
    day: Number(map.day),
    hour: hourRaw,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function partsEqual(parts: CivilParts, local: LocalDateTime): boolean {
  return (
    parts.year === local.year &&
    parts.month === local.month &&
    parts.day === local.day &&
    parts.hour === local.hour &&
    parts.minute === local.minute &&
    parts.second === local.second
  );
}

export const intlTimeZoneProvider: TimeZoneProvider = {
  getOffsetMs(epochMs: number, zone: string): number {
    const fixed = offsetMsFromId(zone);
    if (fixed !== null) return fixed;
    if (unknownZones.has(zone)) {
      throw new TempoError('UNKNOWN_TIMEZONE', `Unknown time zone ${zone}`, { input: zone });
    }
    const local = readParts(epochMs, zone);
    const asUtc = utcMillis(local.year, local.month, local.day, local.hour, local.minute, local.second, 0);
    if (asUtc === null) {
      throw new TempoError('UNKNOWN_TIMEZONE', `Could not resolve offset for ${zone}`, { input: zone });
    }
    const secondMs = epochMs - (epochMs % 1000);
    return asUtc - secondMs;
  },

  getPossibleInstants(local: LocalDateTime, zone: string): number[] {
    const fixed = offsetMsFromId(zone);
    if (fixed !== null) {
      return [local.toNaiveUtcMillis() - fixed];
    }
    formatter(zone);
    const naive = local.toNaiveUtcMillis();
    const probes = [
      naive - 36 * MILLIS_PER_HOUR,
      naive - 24 * MILLIS_PER_HOUR,
      naive - 12 * MILLIS_PER_HOUR,
      naive,
      naive + 12 * MILLIS_PER_HOUR,
      naive + 24 * MILLIS_PER_HOUR,
      naive + 36 * MILLIS_PER_HOUR,
    ];
    const found = new Set<number>();
    for (const probe of probes) {
      const offset = this.getOffsetMs(probe, zone);
      const instant = naive - offset;
      const parts = readParts(instant, zone);
      if (partsEqual(parts, local)) found.add(instant);
    }
    return [...found].sort((a, b) => a - b);
  },

  guess(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  },
};

export function clearTimeZoneCache(): void {
  formatterCache.clear();
  unknownZones.clear();
}
