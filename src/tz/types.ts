import type { LocalDateTime } from '../core/local-datetime.js';

export interface TimeZoneProvider {
  getOffsetMs(epochMs: number, zone: string): number;
  getPossibleInstants(local: LocalDateTime, zone: string): number[];
  guess(): string;
}

export interface ResolvedZone {
  readonly id: string;
  readonly offsetMs: number;
}
