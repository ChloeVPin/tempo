import { TempoError } from '../errors.js';
import type { Overflow } from '../types.js';
import { constrainDate, isValidDate, requireValidDate, type CivilDate } from './civil.js';

export function resolveDate(
  year: number,
  month: number,
  day: number,
  overflow: Overflow = 'constrain',
): CivilDate {
  if (overflow === 'reject') return requireValidDate(year, month, day);
  if (isValidDate(year, month, day)) return { year, month, day };
  return constrainDate(year, month, day);
}

export function requireInteger(name: string, value: number): number {
  if (!Number.isInteger(value)) {
    throw new TempoError('INVALID_DATE', `${name} must be an integer`, { input: value });
  }
  return value;
}

export function requireFinite(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new TempoError('INVALID_DATE', `${name} must be a finite number`, { input: value });
  }
  return value;
}
