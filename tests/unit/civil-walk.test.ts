import { describe, expect, it } from 'vitest';
import { civilFromDays, daysFromCivil, pad2, pad4 } from '../../src/core/civil.js';
import { LocalDate } from '../../src/core/local-date.js';

describe('civil walk 1900-01-01 .. 2100-12-31', () => {
  it('every day round-trips through civil math and ISO parse', () => {
    const start = daysFromCivil(1900, 1, 1);
    const end = daysFromCivil(2100, 12, 31);
    expect(civilFromDays(start)).toEqual({ year: 1900, month: 1, day: 1 });
    expect(civilFromDays(end)).toEqual({ year: 2100, month: 12, day: 31 });
    expect(end - start + 1).toBe(73_414);

    // One tight loop, not 73k individual test cases.
    for (let day = start; day <= end; day++) {
      const civil = civilFromDays(day);
      expect(daysFromCivil(civil.year, civil.month, civil.day)).toBe(day);
      const iso = `${pad4(civil.year)}-${pad2(civil.month)}-${pad2(civil.day)}`;
      const date = LocalDate.fromEpochDay(day);
      expect(date.toISO()).toBe(iso);
      expect(LocalDate.parse(iso).equals(date)).toBe(true);
    }
  });
});
