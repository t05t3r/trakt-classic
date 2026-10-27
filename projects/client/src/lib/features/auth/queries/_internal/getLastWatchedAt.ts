import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { getLatestDate } from '$lib/utils/date/getLatestDate.ts';

export function getLastWatchedAt(timestamps: string[]): Date {
  return assertDefined(
    getLatestDate(timestamps.map((timestamp) => new Date(timestamp))),
    'Expected at least one timestamp',
  );
}
