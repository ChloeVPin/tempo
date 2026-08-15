/**
 * Vitest setup file that installs the pinned Temporal polyfill onto
 * `globalThis`. Used only by the `temporal-diff` CI job via
 * `--setupFiles tests/setup/temporal-polyfill.ts`; the regular `npm test`
 * run never loads this file, so the differential suite skips there unless
 * the host ships native Temporal.
 */
import { Temporal } from '@js-temporal/polyfill';

(globalThis as { Temporal?: unknown }).Temporal = Temporal;
