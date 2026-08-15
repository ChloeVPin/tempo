/** ECMAScript Date range: ±100,000,000 days from epoch. */
export const MIN_EPOCH_DAY = -100_000_000;
export const MAX_EPOCH_DAY = 100_000_000;
export const MIN_EPOCH_MILLIS = -8.64e15;
export const MAX_EPOCH_MILLIS = 8.64e15;
export const MILLIS_PER_SECOND = 1000;
export const MILLIS_PER_MINUTE = 60_000;
export const MILLIS_PER_HOUR = 3_600_000;
export const MILLIS_PER_DAY = 86_400_000;

export function isEpochDayInRange(epochDay: number): boolean {
  return Number.isInteger(epochDay) && epochDay >= MIN_EPOCH_DAY && epochDay <= MAX_EPOCH_DAY;
}

export function isEpochMillisInRange(epochMs: number): boolean {
  return Number.isFinite(epochMs) && epochMs >= MIN_EPOCH_MILLIS && epochMs <= MAX_EPOCH_MILLIS;
}
