import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import {
  bucketByWindowDay,
  type WindowDay,
} from '$lib/utils/date/bucketByWindowDay.ts';
import { parseLocalDate } from '$lib/utils/date/parseLocalDate.ts';

type BucketByLocalDateParams = {
  entries: ReadonlyArray<CalendarEntry>;
  start: Date;
  days: number;
};

// A movie's release is a calendar date, read at local midnight so the zone never shifts it.
function toDay(entry: CalendarEntry): Date {
  return entry.kind === 'episode'
    ? entry.airsAt
    : parseLocalDate(entry.releasedOn);
}

const KIND_ORDER = { episode: 0, movie: 1 } as const;

function byKindThenAirTime(a: CalendarEntry, b: CalendarEntry): number {
  if (a.kind !== 'episode' || b.kind !== 'episode') {
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  }

  return a.airsAt.getTime() - b.airsAt.getTime();
}

export function bucketByLocalDate(
  { entries, start, days }: BucketByLocalDateParams,
): ReadonlyArray<WindowDay<CalendarEntry>> {
  return bucketByWindowDay({
    items: entries.toSorted(byKindThenAirTime),
    dayOf: toDay,
    start,
    days,
  });
}
