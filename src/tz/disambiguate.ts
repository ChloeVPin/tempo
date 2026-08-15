import { TempoError } from '../errors.js';
import type { LocalDateTime } from '../core/local-datetime.js';
import type { Disambiguation } from '../types.js';
import { MILLIS_PER_HOUR } from '../core/range.js';
import type { TimeZoneProvider } from './types.js';

export function resolveLocalInstant(
  local: LocalDateTime,
  zone: string,
  provider: TimeZoneProvider,
  disambiguation: Disambiguation,
): number {
  const instants = provider.getPossibleInstants(local, zone);
  if (instants.length === 1) return instants[0]!;
  if (instants.length > 1) {
    if (disambiguation === 'reject') {
      throw new TempoError(
        'TIMEZONE_OVERLAP',
        `${local.toISO()} is ambiguous in ${zone}`,
        { input: { local: local.toISO(), zone } },
      );
    }
    if (disambiguation === 'later') return instants[instants.length - 1]!;
    return instants[0]!;
  }

  if (disambiguation === 'reject') {
    throw new TempoError(
      'TIMEZONE_GAP',
      `${local.toISO()} does not exist in ${zone}`,
      { input: { local: local.toISO(), zone } },
    );
  }

  const naive = local.toNaiveUtcMillis();
  const windows = [3, 6, 12, 24, 36, 48].map((hours) => hours * MILLIS_PER_HOUR);
  let before = provider.getOffsetMs(naive - windows[0]!, zone);
  let after = provider.getOffsetMs(naive + windows[0]!, zone);
  for (const delta of windows) {
    before = provider.getOffsetMs(naive - delta, zone);
    after = provider.getOffsetMs(naive + delta, zone);
    if (before !== after) break;
  }
  const earlierInstant = naive - after;
  const laterInstant = naive - before;
  const earlier = Math.min(earlierInstant, laterInstant);
  const later = Math.max(earlierInstant, laterInstant);
  if (disambiguation === 'earlier') return earlier;
  return later;
}
