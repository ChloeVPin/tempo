import { describe, expect, it } from 'vitest';
import * as Tempo from '../../src/index.js';
import * as Format from '../../src/format/index.js';
import * as IntlEntry from '../../src/intl/index.js';
import * as Relative from '../../src/relative/index.js';
import * as MomentCompat from '../../src/compat/moment/index.js';
import * as TemporalInterop from '../../src/temporal/index.js';

describe('public API exports', () => {
  it('keeps the main barrel focused on core and timezone APIs', () => {
    expect(Tempo.Interval).toBeDefined();
    expect(Tempo.DateRange).toBeDefined();
    expect(Tempo.Instant).toBeDefined();
    expect(Tempo.ZonedDateTime).toBeDefined();
    expect(Tempo).not.toHaveProperty('format');
    expect(Tempo).not.toHaveProperty('toLocaleString');
    expect(Tempo).not.toHaveProperty('relativeTime');
    expect(Tempo).not.toHaveProperty('moment');
  });

  it('keeps advanced APIs available from their documented subpaths', () => {
    expect(Format.format).toBeDefined();
    expect(IntlEntry.toLocaleString).toBeDefined();
    expect(Relative.relativeTime).toBeDefined();
    expect(MomentCompat.moment).toBeDefined();
    expect(TemporalInterop.toTemporalInstant).toBeDefined();
  });
});
