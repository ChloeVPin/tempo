/**
 * Direct Intl probe used to decide whether the host ICU ships historical
 * timezone data. The library under test is not involved, so a skip decision
 * can never be caused by a library bug.
 *
 * Returns the local wall time as `YYYY-MM-DDTHH:mm:ss` for the given ISO
 * instant and IANA zone, exactly as `Intl.DateTimeFormat` reports it.
 */
export function intlLocalAt(iso: string, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(iso));
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  const hour = map.hour === '24' ? '00' : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}:${map.second}`;
}
