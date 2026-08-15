import { TempoError } from '../errors.js';
import type { LocalDate } from './local-date.js';

export interface IntervalEndpoint<T> {
  compare(other: T): number;
}

/** An immutable half-open interval [start, end). Equal endpoints form an empty interval. */
export class Interval<T extends IntervalEndpoint<T>> {
  private constructor(
    readonly start: T,
    readonly end: T,
  ) {}

  static of<T extends IntervalEndpoint<T>>(start: T, end: T): Interval<T> {
    if (compareEndpoints(start, end) > 0) {
      throw new TempoError('INVALID_INTERVAL', 'Interval end must not be before start', {
        input: { start, end },
      });
    }
    return new Interval(start, end);
  }

  isEmpty(): boolean {
    return compareEndpoints(this.start, this.end) === 0;
  }

  contains(value: T): boolean {
    return compareEndpoints(this.start, value) <= 0 && compareEndpoints(value, this.end) < 0;
  }

  overlaps(other: Interval<T>): boolean {
    return (
      compareEndpoints(this.start, other.end) < 0 && compareEndpoints(other.start, this.end) < 0
    );
  }

  abuts(other: Interval<T>): boolean {
    return (
      compareEndpoints(this.end, other.start) === 0 || compareEndpoints(other.end, this.start) === 0
    );
  }

  intersection(other: Interval<T>): Interval<T> | null {
    if (!this.overlaps(other)) return null;
    const start = compareEndpoints(this.start, other.start) >= 0 ? this.start : other.start;
    const end = compareEndpoints(this.end, other.end) <= 0 ? this.end : other.end;
    return Interval.of(start, end);
  }

  union(other: Interval<T>): Interval<T> | null {
    if (!this.overlaps(other) && !this.abuts(other)) return null;
    const start = compareEndpoints(this.start, other.start) <= 0 ? this.start : other.start;
    const end = compareEndpoints(this.end, other.end) >= 0 ? this.end : other.end;
    return Interval.of(start, end);
  }

  equals(other: Interval<T>): boolean {
    return (
      compareEndpoints(this.start, other.start) === 0 && compareEndpoints(this.end, other.end) === 0
    );
  }
}

export type DateRange = Interval<LocalDate>;

export const DateRange = {
  of(start: LocalDate, end: LocalDate): DateRange {
    return Interval.of(start, end);
  },
};

function compareEndpoints<T extends IntervalEndpoint<T>>(a: T, b: T): number {
  const result = a.compare(b);
  if (Number.isNaN(result)) {
    throw new TempoError('INVALID_INTERVAL', 'Interval endpoints must be comparable', {
      input: { a, b },
    });
  }
  return result < 0 ? -1 : result > 0 ? 1 : 0;
}
